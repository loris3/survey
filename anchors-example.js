export async function loadAnchorsExample1(){
    div = d3.select("#anchors-example-1");
    lime.RenderExplanationFrame(div,["example", "example"], [0.0, 1.0],
    false, {
        "names": ["example", "This", "is"], "certainties": [0.6, 0.8, 0.9], "supports": [0.0,0.0,0.0], "allPrecision": 0, 
        "examples": [
        {"coveredTrue": [
                {"text": "This was an example.", "rawIndexes": [["example", 12, 1]]}, 
                {"text": "This can be an example.", "rawIndexes": [["example", 15, 1]]}, 
                {"text": "This might be an example.", "rawIndexes": [["example", 17, 1]]}, 
                {"text": "This is the example.", "rawIndexes": [["example", 12, 1]]}, 
                {"text": "This is one example.", "rawIndexes": [["example", 12, 1]]}, 
                {"text": "This is another  example.", "rawIndexes": [["example", 17, 1]]}, 
                ], 
            "coveredFalse": [
            {"text": "The word example.", "rawIndexes": [["example", 9, 1]]}, 
                {"text": "It can't be an example.", "rawIndexes": [["example", 15, 1]]}, 
                {"text": "It can't count as an example.", "rawIndexes": [["example", 21, 1]]}, 
                {"text": "This ain't no example.", "rawIndexes": [["example", 17, 1]]}, 
                {"text": "This does not count as an example.", "rawIndexes": [["example", 26, 1]]}, 
                {"text": "This is not an example.", "rawIndexes": [["example", 15, 1]]}, 
                {"text": "This is never an example.", "rawIndexes": [["example", 17, 1]]}, 
            ], },
            {"coveredTrue": [
                {"text": "This was an example.", "rawIndexes": [["This", 0,1],["example", 12, 1]]}, 
                {"text": "This can be an example.", "rawIndexes": [["This", 0,1],["example", 15, 1]]}, 
                {"text": "This might be an example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
                {"text": "This is the example.", "rawIndexes": [["This", 0,1],["example", 12, 1]]}, 
                {"text": "This is one example.", "rawIndexes": [["This", 0,1],["example", 12, 1]]}, 
                {"text": "This is another  example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
                ], 
            "coveredFalse": [
                {"text": "This ain't no example.", "rawIndexes": [["This", 0,1],["example", 14, 1]]}, 
                {"text": "This can't be an example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
                {"text": "This does not count as an example.", "rawIndexes": [["This", 0,1],["example", 26, 1]]}, 
                {"text": "This is not an example.", "rawIndexes": [["This", 0,1],["example", 15, 1]]}, 
                {"text": "This is never an example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
            ], },
            {"coveredTrue": [
                {"text": "This is the example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 12, 1]]}, 
                {"text": "This is one example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 12, 1]]}, 
                {"text": "This is another  example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 17, 1]]}, 
                ], 
            "coveredFalse": [
            {"text": "This is not an example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 15, 1]]}, 
                {"text": "This is never an example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 17, 1]]}, 
            ], },
        ]
    }, {"text": "This is an example.", "rawIndexes": [["example", 11, 1],["This", 0, 1],["is", 5, 1]]}, "text", "anchor");
    document.querySelector("#anchors-example-1 > div > div:nth-child(2) > div > div > div > div:nth-child(1) > div > div > div").click();
    document.querySelector("#anchors-example-1 > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div > div > div").click();
}  
export async function loadAnchorsExample2(){
    div = d3.select("#anchors-example-2");
    lime.RenderExplanationFrame(div,["example", "example"], [0.0, 1.0],
    false, {
        "names": ["example", "This", "is"], "certainties": [0.6, 0.8, 0.9], "supports": [0.0,0.0,0.0], "allPrecision": 0, 
        "examples": [
        {"coveredTrue": [
                {"text": "This was an example.", "rawIndexes": [["example", 12, 1]]}, 
                {"text": "This can be an example.", "rawIndexes": [["example", 15, 1]]}, 
                {"text": "This might be an example.", "rawIndexes": [["example", 17, 1]]}, 
                {"text": "This is the example.", "rawIndexes": [["example", 12, 1]]}, 
                {"text": "This is one example.", "rawIndexes": [["example", 12, 1]]}, 
                {"text": "This is another  example.", "rawIndexes": [["example", 17, 1]]}, 
                ], 
            "coveredFalse": [
            {"text": "The word example.", "rawIndexes": [["example", 9, 1]]}, 
                {"text": "It can't be an example.", "rawIndexes": [["example", 15, 1]]}, 
                {"text": "It can't count as an example.", "rawIndexes": [["example", 21, 1]]}, 
                {"text": "This ain't no example.", "rawIndexes": [["example", 14, 1]]}, 
                {"text": "This can't be an example.", "rawIndexes": [["example", 17, 1]]}, 
                {"text": "This does not count as an example.", "rawIndexes": [["example", 26, 1]]}, 
                {"text": "This is not an example.", "rawIndexes": [["example", 15, 1]]}, 
                {"text": "This is never an example.", "rawIndexes": [["example", 17, 1]]}, 
            ], },
            {"coveredTrue": [
                {"text": "This was an example.", "rawIndexes": [["This", 0,1],["example", 12, 1]]}, 
                {"text": "This can be an example.", "rawIndexes": [["This", 0,1],["example", 15, 1]]}, 
                {"text": "This might be an example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
                {"text": "This is the example.", "rawIndexes": [["This", 0,1],["example", 12, 1]]}, 
                {"text": "This is one example.", "rawIndexes": [["This", 0,1],["example", 12, 1]]}, 
                {"text": "This is another  example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
                ], 
            "coveredFalse": [
                {"text": "This ain't no example.", "rawIndexes": [["This", 0,1],["example", 14, 1]]}, 
                {"text": "This can't be an example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
                {"text": "This does not count as an example.", "rawIndexes": [["This", 0,1],["example", 26, 1]]}, 
                {"text": "This is not an example.", "rawIndexes": [["This", 0,1],["example", 15, 1]]}, 
                {"text": "This is never an example.", "rawIndexes": [["This", 0,1],["example", 17, 1]]}, 
            ], },
            {"coveredTrue": [
                {"text": "This is the example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 12, 1]]}, 
                {"text": "This is one example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 12, 1]]}, 
                {"text": "This is another  example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 17, 1]]}, 
                ], 
            "coveredFalse": [
            {"text": "This is not an example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 15, 1]]}, 
                {"text": "This is never an example.", "rawIndexes": [["This", 0,1],["is", 5, 1],["example", 17, 1]]}, 
            ], },
        ]
    }, {"text": "This is an example.", "rawIndexes": [["example", 11, 1],["This", 0, 1],["is", 5, 1]]}, "text", "anchor");
    document.querySelector("#anchors-example-2 > div > div:nth-child(2) > div > div > div > div:nth-child(1) > div > div > div").click();
    document.querySelector("#anchors-example-2 > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div > div > div").click();

    document.querySelector("#anchors-example-2 > div > div:nth-child(1) > div:nth-child(2) > div > div.ant-card-body > div > div:nth-child(1) > div > button:nth-child(2)").addEventListener("click", (event)=>{
        if(event.target.getAnimations()[0]){
            event.target.getAnimations()[0].cancel()
        }
       
    })
}  