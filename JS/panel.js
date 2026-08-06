const URL = "https://pzfcaypdorwhohkxvnyu.supabase.co";
const KEY = "sb_publishable_fUIyPY2429bVgbkWwltuGg_0gAAf0U0"; // Deja aquí tu misma clave

let player = null;
let videoActual = "";

// ======= API DE YOUTUBE =======
window.onYouTubeIframeAPIReady = function () {

    player = new YT.Player("player", {

        width: "100%",
        height: "720",

        playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0
        },

        events: {
            onReady: () => {
                console.log("Player listo");
            },
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }

    });

};

function onPlayerStateChange(event) {

    if (event.data === YT.PlayerState.ENDED) {
        siguienteCancion();
    }

}

function onPlayerError(event) {

    console.warn("Error reproduciendo video, código:", event.data);

    // Códigos 101, 150 = no permite embed | 100 = eliminado/privado
    // 2 = ID inválido | genérico = restricción regional u otro fallo temporal
    document.getElementById("actual").innerHTML =
        "<p>⚠️ No se pudo reproducir esta canción, saltando a la siguiente...</p>";

    siguienteCancion();

}

// Limpia el player cuando no hay nada que reproducir,
// para que no se quede "congelado" mostrando el último error.
function detenerPlayer() {

    if (player && typeof player.stopVideo === "function") {

        try {
            player.stopVideo();
        } catch (e) {
            console.warn("No se pudo detener el player:", e);
        }

    }

}

// ===============================

async function cargarCanciones() {

    try {

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

            // No hay nada activo: si el player quedó con un video
            // cargado o mostrando error, lo detenemos para limpiarlo.
            detenerPlayer();

        }

        document.getElementById("actual").innerHTML = actual;
        document.getElementById("lista").innerHTML = html;

        if (videoActual && player) {

    if (player.getPlayerState() === YT.PlayerState.UNSTARTED) {

        player.loadVideoById(videoActual);

    }

}

    } catch (e) {

        console.error(e);

    }

}

// ===============================

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

// ===============================

async function siguienteCancion() {

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

        detenerPlayer();
        cargarCanciones();

    }

}

// ===============================

setInterval(cargarCanciones, 3000);

cargarCanciones();