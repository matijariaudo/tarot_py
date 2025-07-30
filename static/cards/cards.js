    let grupoN=0;
    //alert(ancho+" "+anchoCard)
    $(window).on("load",function() {
        sizeCards()
    })
    $(window).resize(function() {
        sizeCards()
    });
    function sizeCards() {
        ancho=$(".card-container").width()
        anchoCard=$(".card").width()
        margin=-(anchoCard+2)+(ancho-anchoCard)/39+"px";
        $(".card").css("margin-left",margin)
        $(".card:first-child").css("margin-left","0px")
        return margin;
    }
    function createCardGroup(div,cardsReady=[]) {
        const identificador=generarCadenaAleatoria(5)
        let group = $('<div>', { class: 'card-container'});
        for (let i = 0; i < 40; i++) {
            group.append(`<div class="card card_${identificador} card_${identificador}_${i}"></div>`);
        }
        $(div).append(group); // Añade el nuevo grupo al body
        sizeCards(group); // Ajusta el tamaño de las cartas en el nuevo grupo
        var cardChoose=cardsReady.length==0?0:3;
        var cardChooseData=cardsReady;
        checkCard();
        function checkCard(){
            if(cardChoose==3){
                console.log(cardChooseData)
                let event = new CustomEvent("cards", {
                detail: { cards: cardChooseData }
                });
                cardChooseData.forEach((e) => {
                    $(`.card_${identificador}_${e}`).css("margin-top","10px")
                    $(`.card_${identificador}_${e}`).css("background-color","#03fc9d")
                    $(`.card_${identificador}_${e}`).css("border","1px solid #000")
                });
                document.dispatchEvent(event);
            }
        }
        group.find('.card').click(function() {
            let cardIndex = $(this).index();
            if(cardChoose<3 && !cardChooseData.includes(cardIndex)){
                //console.log("Clic en carta #" + (cardIndex + 1) + " del grupo " + id);
                $(this).css("margin-top","10px")
                $(this).css("background-color","#03fc9d")
                $(this).css("border","1px solid #000")
                cardChooseData.push(cardIndex)
                cardChoose++;
                checkCard()
            }
        });
    }

    

    function generarCadenaAleatoria(longitud) {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let cadena = '';
        
        for (let i = 0; i < longitud; i++) {
            const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
            cadena += caracteres.charAt(indiceAleatorio);
        }
        
        return cadena;
    }