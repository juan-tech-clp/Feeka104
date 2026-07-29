const URL_SERVER = "https://feeka104.onrender.com/";

const SUPABASE_URL = "https://pzfcaypdorwhohkxvnyu.supabase.co";

const SUPABASE_KEY = "sb_publishable_fUIyPY2429bVgbkWwltuGg_0gAAf0U0";

let cancionSeleccionada = null;

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

async function buscarCanciones(){

    const texto = document.getElementById("buscar").value.trim();

    if(texto.length < 3){

        alert("Escribe el nombre de la canción.");

        return;

    }

    document.getElementById("resultados").innerHTML = "🔍 Buscando...";

    try{

        const respuesta = await fetch(
            URL_SERVER + "/search?q=" + encodeURIComponent(texto)
        );

        const canciones = await respuesta.json();

        let html = "";

        canciones.forEach(c => {

            html += `
            <div class="resultado" onclick='seleccionar(${JSON.stringify(c)})'>

                <img src="${c.miniatura}" alt="Miniatura">

                <div>

                    <b>${c.titulo}</b><br>

                    <small>${c.canal}</small>

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
                    video_id:cancionSeleccionada.videoId,
                    thumbnail:cancionSeleccionada.miniatura,
                    usuario:usuario,
                    estado:"pendiente"

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