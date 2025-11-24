Let's discuss this update before getting into code.  

In this sprint we are making the openrouter API request from the TextToTextNode.vue.  
Let's remove the generated text box.  
Instead, depending on how many models are selected, when the API request result arrives, we should create a new text node to the right of the requesting TextToTextNode with the title of the model. 
So, if there are two models selected, it would generate two text nodes, with the result as the value
THat means we'll need to update the TextNode with prop for title.  Let's also make a user modifiable title in the header.
So instead of displaying "Text Node", it'll be the title.  If the user were to click on the title they can modify it. 
