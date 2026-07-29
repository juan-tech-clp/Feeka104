const URL = "https://pzfcaypdorwhohkxvnyu.supabase.co";
const KEY = "sb_publishable_fUIyPY2429bVgbkWwltuGg_0gAAf0U0";

let player;
let videoActual = "";

function onYouTubeIframeAPIReady() {

    player = new YT.Player("player", {

        width: 1280,
        height: 720,

        videoId: "",

        playerVars: {
            autoplay: 1,
            controls: 1
        },

        events: {
            onStateChange: onPlayerStateChange
        }

    });

}

function onPlayerStateChange(event) {

    if (event.data === YT.PlayerState.ENDED) {

        siguienteCancion();

    }

}

async function cargarCanciones() {

    const respuesta = await fetch(

        URL + "/rest/v1/solicitudes?select=*&order=created_at.asc",

        {
            headers: {
                apikey: KEY,
                Authorization: "Bearer " + KEY
            }
        }

    );

    const datos = await respuesta.json();

    let html = "";
    let actual = "";

    videoActual = "";

    datos.forEach(c => {

        if (c.estado === "reproduciendo") {

            videoActual = c.video_id;

            actual = `
                <h2>${c.cancion}</h2>
                <p><b>${c.artista}</b></p>
                <p>Pedido por ${c.usuario}</p>
            `;

        }

        if (c.estado === "pendiente") {

            html += `
            <tr>
                <td>${c.artista}</td>
                <td>${c.cancion}</td>
                <td>${c.usuario}</td>
                <td>
                    <button onclick="reproducir('${c.id}')">
                        ▶ Reproducir
                    </button>
                </td>
            </tr>
            `;

        }

    });

    if (actual === "") {

        actual = "<p>No hay ninguna canción reproduciéndose.</p>";

    }

    document.getElementById("actual").innerHTML = actual;
    document.getElementById("lista").innerHTML = html;

    if (videoActual && player) {

        const actualVideo = (player.getVideoData() || {}).video_id || "";

        if (actualVideo !== videoActual) {

            player.loadVideoById(videoActual);

        }

    }

}

async function reproducir(id) {

    await fetch(

        URL + "/rest/v1/solicitudes?estado=eq.reproduciendo",

        {
            method: "PATCH",
            headers: {
                apikey: KEY,
                Authorization: "Bearer " + KEY,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify({
                estado: "finalizada"
            })
        }

    );

    await fetch(

        URL + "/rest/v1/solicitudes?id=eq." + id,

        {
            method: "PATCH",
            headers: {
                apikey: KEY,
                Authorization: "Bearer " + KEY,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify({
                estado: "reproduciendo"
            })
        }

    );

    cargarCanciones();

}

async function siguienteCancion() {

    // Buscar la canción actual
    const actual = await fetch(

        URL + "/rest/v1/solicitudes?estado=eq.reproduciendo",

        {
            headers: {
                apikey: KEY,
                Authorization: "Bearer " + KEY
            }
        }

    );

    const reproduciendo = await actual.json();

    if (reproduciendo.length > 0) {

        await fetch(

            URL + "/rest/v1/solicitudes?id=eq." + reproduciendo[0].id,

            {
                method: "PATCH",
                headers: {
                    apikey: KEY,
                    Authorization: "Bearer " + KEY,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal"
                },
                body: JSON.stringify({
                    estado: "finalizada"
                })
            }

        );

    }

    // Buscar la siguiente pendiente
    const cola = await fetch(

        URL + "/rest/v1/solicitudes?estado=eq.pendiente&order=created_at.asc&limit=1",

        {
            headers: {
                apikey: KEY,
                Authorization: "Bearer " + KEY
            }
        }

    );

    const siguiente = await cola.json();

    if (siguiente.length > 0) {

        await reproducir(siguiente[0].id);

    } else {

        cargarCanciones();

    }

}

cargarCanciones();

setInterval(cargarCanciones, 3000);