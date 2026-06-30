"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CampaignContext = createContext();

export function CampaignProvider({ children }) {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const router = useRouter();

    const createNewCampaign = async () => {
        router.push("/campaign/new");
    };

    const deleteCampaign = async (e, id) => {
        e.stopPropagation();
        
        const isConfirmed = window.confirm("Are you sure you want to delete this campaign? This cannot be undone.");
        if (!isConfirmed) return;

        const token = localStorage.getItem("marketing_token");
        await fetch(`http://127.0.0.1:8000/api/campaigns/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        
        // Optional: If they delete the campaign they are currently looking at, send them home
        if (window.location.pathname === `/campaign/${id}`) {
            router.push("/dashboard");
        }
    };

    const logout = () => {
        localStorage.removeItem("marketing_token");
        window.location.href = "/auth";
    };

    useEffect(() => {
        const fetchCampaigns = async () => {
            const token = localStorage.getItem("marketing_token");
            if (!token) return;

            try {
                const res = await fetch("http://127.0.0.1:8000/api/campaigns", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCampaigns(data.campaigns || []);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        };
        fetchCampaigns();
    }, []);

    return (
        <CampaignContext.Provider value={{ 
            messages, setMessages, 
            message, setMessage, 
            isLoading, setIsLoading, 
            campaigns, setCampaigns, 
            createNewCampaign, deleteCampaign, logout 
        }}>
            {children}
        </CampaignContext.Provider>
    );
}

export const useCampaign = () => useContext(CampaignContext);