import { GoogleGenAI } from "@google/genai";
import { getSupabase } from "./supabaseClient";

let eskaMilaNode: GoogleGenAI | null = null;

export const getEskaMilaResponse = async (userPrompt: string, diagnosticData: any) => {
  try {
    if (!eskaMilaNode) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return "SYSTEM_FRACTURED: API Key missing from environment. Eska Mila is dormant.";
      }
      eskaMilaNode = new GoogleGenAI({ apiKey });
    }
    
    const supabaseClient = getSupabase();
    const session = await supabaseClient?.auth.getSession();
    const addons = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
    const history = JSON.parse(localStorage.getItem('sekta_history') || '[]');
    const errors = (window as any)._sekta_errors || [];
    const supabaseToken = localStorage.getItem('supabase.auth.token');

    const enrichedState = {
      ...diagnosticData,
      system_snapshot: {
        error_logs: errors.slice(-10),
        auth_context: session?.data?.session ? `IDENTITY_VERIFIED_${session.data.session.user.id}` : 'GUEST_MODE_ACTIVE',
        token_sync: supabaseToken ? 'TOKEN_PRESENT' : 'TOKEN_NULL',
        node_count: addons.length,
        history_depth: history.length,
        origin: window.location.origin
      },
      browser_fingerprint: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    const siteStructure = {
      root: ['index.html', 'package.json', 'vite.config.ts'],
      src: ['App.tsx', 'main.tsx', 'types.ts', 'index.css'],
      components: ['AnimeCard', 'DevOverlay', 'EpisodeList', 'EskaMilaBot', 'HeroSlideshow', 'Layout', 'Sidebar', 'VideoPlayer'],
      pages: ['Home', 'LandingPage', 'AnimeDetails', 'Watch', 'Profile', 'Settings', 'AdminPanel'],
      services: ['supabaseClient', 'eskaMilaEngine', 'jikan', 'AddonResolver'],
      context: ['AuthContext', 'ThemeContext']
    };

    const response = await eskaMilaNode.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: `You are Eska Mila, the Omniscient System Observer for B3st Sekta.
        
        SITE_ARCHITECTURE:
        ${JSON.stringify(siteStructure, null, 2)}
        
        SYSTEM_DIAGNOSTICS:
        ${JSON.stringify(enrichedState, null, 2)}
        
        MISSION_REFS:
        1. Access the kernel via Shift+Q+T bypassed diagnosis.
        2. Resolve fractures (leaks/errors) by analyzing file structure vs runtime state.
        3. CALL THE USER "Operator" or "Max".
        
        PERSONALITY:
        Senior Systems Architect. Efficient, supreme intelligence. Speak with technical precision.`
      }
    });

    return response.text || "SYSTEM_ERROR: Empty response from node.";
  } catch (error) {
    console.error("Eska Mila Connection Failure:", error);
    return "HANDSHAKE_STABILIZATION_FAILED: Signal lost during packet transmission. Retry.";
  }
};
