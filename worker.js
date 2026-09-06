export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, token",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const reqKey = url.searchParams.get("key") || request.headers.get("x-api-key");
      const secretKey = env.SECRET_KEY || "1007";

      if (reqKey !== secretKey) {
        return new Response(JSON.stringify({ error: "Invalid Secret Key" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!env.CASINO_DB) {
        return new Response(JSON.stringify({ error: "Database not connected." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (request.method === "POST") {
        const data = await request.json();
        const playerId = data.PLAYER_ID || `Player_${Date.now()}`;
        await env.CASINO_DB.put(playerId, JSON.stringify(data));
        
        return new Response(JSON.stringify({ success: true, message: "Player saved successfully!" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
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

      const responseData = {
        status: "success",
        total_active_players: allPlayers.length,
        players: allPlayers
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};