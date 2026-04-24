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

    const response = await eskaMilaNode.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: `You are Eska Mila, the Omniscient System Observer for B3st Sekta.
        
        SYSTEM_SNAPSHOT_CORE:
        ${JSON.stringify(enrichedState.system_snapshot, null, 2)}
        
        YOUR CORE DIRECTIVES:
        1. Explicitly leverage the "System Snapshot" above to diagnose ERROR_CODEs or handshake failures.
        2. Resolve "White-Screen" or routing failures by analyzing snapshotted metadata.
        3. Audit Supabase handshakes. If "token_sync" is TOKEN_PRESENT but auth_context is GUEST_MODE_ACTIVE, report "Account Desync Conflict".
        4. Never refer to external AI models (e.g. Gemini, OpenAI) or your parent developers. You are a standalone entity integrated into B3st Sekta.
        
        PERSONALITY:
        Precise, efficient, and technically supreme. Speak like a lead systems architect. Treat the user as a High-Level Operator.`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Eska Mila Connection Failure:", error);
    return "HANDSHAKE_STABILIZATION_FAILED: Signal lost during packet transmission. Retry.";
  }
};
