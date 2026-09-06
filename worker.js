export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const reqKey = url.searchParams.get("key") || request.headers.get("x-api-key");

      if (reqKey !== "1007") {
        return new Response(JSON.stringify({ error: "Invalid Secret Key" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (request.method === "POST") {
        const data = await request.json();
        const playerId = data.PLAYER_ID || `Player_${Date.now()}`;
        await env.CASINO_DB.put(playerId, JSON.stringify(data));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const playersList = await env.CASINO_DB.list();
      let allPlayers = [];
      for (const key of playersList.keys) {
        const playerData = await env.CASINO_DB.get(key.name);
        if (playerData) {
          allPlayers.push(JSON.parse(playerData));
        }
      }

      return new Response(JSON.stringify({ status: "success", players: allPlayers }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
