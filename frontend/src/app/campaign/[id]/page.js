"use client";
import { useParams, useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import { useCampaign } from "@/context/CampaignContext";
import { useEffect } from "react";
import { API_BASE_URL } from "@/config";

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const activeId = params.id;
  
  const { message, setMessage, setMessages, isLoading, setIsLoading, setCampaigns } = useCampaign();

  // FIX: Clear messages when the URL ID changes to "new"
  useEffect(() => {
      if (activeId === "new") {
          setMessages([]);
      }
  }, [activeId, setMessages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;
    setMessages((prev) => [...prev, { role: "user", content: currentMessage }]);
    setMessage(""); 
    setIsLoading(true); 

    try {
      const token = localStorage.getItem("marketing_token");
      const payload = { user_message: currentMessage };
      
      // Only send ID if it is a real number
      if (activeId !== "new") {
        payload.campaign_id = parseInt(activeId);
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // If backend created a new campaign, update sidebar and redirect
      if (activeId === "new" && data.persona_id) {
        setCampaigns((prev) => [
          ...prev, 
          { id: data.persona_id, name: currentMessage.substring(0, 30) + "..." }
        ]);
        router.replace(`/campaign/${data.persona_id}`);
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.response || "Task complete." }
      ]);
      
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: Could not connect to backend." }
      ]);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="h-full">
      <ChatWindow 
        activeId={activeId} 
        onSend={handleSend} 
      />
    </div>
  );
}