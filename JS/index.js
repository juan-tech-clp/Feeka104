const URL_SERVER = window.location.origin;

const SUPABASE_URL = "https://pzfcaypdorwhohkxvnyu.supabase.co";

const SUPABASE_KEY = "sb_publishable_fUIyPY2429bVgbkWwltuGg_0gAAf0U0";

let cancionSeleccionada = null;
let resultadosActuales = []; // guardamos aquí los resultados en memoria

// Buscar con botón
document.getElementById("btnBuscar").addEventListener("click", buscarCanciones);

// Buscar con Enter
document.getElementById("buscar").addEventListener("keydown", function(e){

    if(e.key === "Enter"){
        buscarCanciones();
    }

});

// Enviar solicitud
document.getElementById("btnEnviar").addEventListener("click", enviarSolicitud);

// Escucha los clics en los resultados (delegación de eventos,
// en vez de inyectar JSON dentro de onclick="")
document.getElementById("resultados").addEventListener("click", function(e){

    const tarjeta = e.target.closest(".resultado");

    if(!tarjeta) return;

    const indice = Number(tarjeta.dataset.index);

    if(!Number.isNaN(indice) && resultadosActuales[indice]){

        seleccionar(resultadosActuales[indice]);

    }

});

async function buscarCanciones(){

    const texto = document.getElementById("buscar").value.trim();

    if(texto.length < 3){

        alert("Escribe el nombre de la canción.");

        return;

    }

    document.getElementById("resultados").innerHTML = "🔍 Buscando...";

    try{

        // Buscamos en YouTube y Deezer al mismo tiempo
        const [respYoutube, respDeezer] = await Promise.all([

            fetch(URL_SERVER + "/search?q=" + encodeURIComponent(texto))
                .then(r => r.json())
                .catch(() => []),

            fetch(URL_SERVER + "/search-deezer?q=" + encodeURIComponent(texto))
                .then(r => r.json())
                .catch(() => [])

        ]);

        const cancionesYoutube = Array.isArray(respYoutube) ? respYoutube : [];
        const cancionesDeezer = Array.isArray(respDeezer) ? respDeezer : [];

        // YouTube primero (canción completa), Deezer como respaldo
        resultadosActuales = [...cancionesYoutube, ...cancionesDeezer];

        let html = "";

        resultadosActuales.forEach((c, i) => {

            const insignia = c.fuente === "deezer"
                ? '<span style="color:#ff884d;font-size:12px;">🎧 Deezer · preview 30s</span>'
                : '<span style="color:#ff2d55;font-size:12px;">▶ YouTube</span>';

            html += `
            <div class="resultado" data-index="${i}">

                <img src="${escaparHtml(c.miniatura)}" alt="Miniatura">

                <div>

                    <b>${escaparHtml(c.titulo)}</b><br>

                    <small>${escaparHtml(c.canal)}</small><br>

                    ${insignia}

                </div>

            </div>
            `;

        });

        if(html === ""){

            html = "<p>No se encontraron resultados.</p>";

        }

        document.getElementById("resultados").innerHTML = html;

    }catch(error){

        console.error(error);

        document.getElementById("resultados").innerHTML =
        "<p>Error al buscar canciones.</p>";

    }

}

// Evita que títulos con <, >, & rompan el HTML al mostrarlos
function escaparHtml(texto){

    if(!texto) return "";

    return texto
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

}

function seleccionar(c){

    cancionSeleccionada = c;

    document.getElementById("buscar").value = c.titulo;

    document.getElementById("resultados").innerHTML = "";

}

async function enviarSolicitud(){

    if(!cancionSeleccionada){

        alert("Selecciona una canción.");

        return;

    }

    const usuario = document.getElementById("usuario").value.trim();

    if(usuario === ""){

        alert("Escribe tu nombre.");

        return;

    }

    try{

        // El campo video_id guarda el ID de YouTube o la URL de preview de Deezer,
        // según corresponda. El campo fuente indica cuál es cuál.
        const identificador = cancionSeleccionada.fuente === "deezer"
            ? cancionSeleccionada.previewUrl
            : cancionSeleccionada.videoId;

        const respuesta = await fetch(

            SUPABASE_URL + "/rest/v1/solicitudes",

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",
                    apikey:SUPABASE_KEY,
                    Authorization:"Bearer " + SUPABASE_KEY

                },

                body:JSON.stringify({

                    artista:cancionSeleccionada.canal,
                    cancion:cancionSeleccionada.titulo,
                    canal:cancionSeleccionada.canal,
                    video_id:identificador,
                    thumbnail:cancionSeleccionada.miniatura,
                    usuario:usuario,
                    estado:"pendiente",
                    fuente:cancionSeleccionada.fuente

                })

            }

        );

        if(respuesta.ok){

            document.getElementById("mensaje").innerHTML =
            "✅ Canción enviada correctamente.";

            document.getElementById("buscar").value = "";
            document.getElementById("usuario").value = "";
            document.getElementById("resultados").innerHTML = "";

            cancionSeleccionada = null;

        }else{

            const error = await respuesta.text();

            document.getElementById("mensaje").innerHTML =
            "❌ " + error;

        }

    }catch(error){

        console.error(error);

        document.getElementById("mensaje").innerHTML =
        "❌ Error de conexión.";

    }

}