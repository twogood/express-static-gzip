(function(){
    var div = document.createElement("div");

    div.id = "appended-div";
    div.className = "app-div";
    div.innerText = "appended";
    
    document.body.appendChild(div);
})();