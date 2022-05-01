// Flip a coin and show coin image to match result when "Flip it" button is clicked
const coin = document.getElementById("coin")
coin.addEventListener("click", flipACoin)

// asynchronous function to await response
async function flipACoin() {
// URL endpoint 
    const endpoint = "app/flip/"
    const url = document.baseURI+endpoint
// sends a GET request to the API endpoint and waits for a response
    await fetch(url)
// receives the response as JSON
  		    .then(function(response) {
                // json resonse returned
    		    return response.json();
  		      })
			    .then(function(result) {
                    // returned json is processed and outputs either tail/heads image of quarter
				    console.log(result);
				    document.getElementById("result").innerHTML = result.flip;
				    document.getElementById("quarter").setAttribute("src", "assets/img/"+result.flip+".png");
				  });
  };


// Flip multiple coins and show coin images in table as well as summary results by entering number and pressing button 
const coins = document.getElementById("coins")
coins.addEventListener("submit", flipCoins)

// submit handler of "Flip it!" button
async function flipCoins(event) {
	event.preventDefault();
	const endpoint = "app/flip/coins/"
	const url = document.baseURI+endpoint
//  extracts data object from the form to run it through the FormData API
	const formEvent = event.currentTarget
// give the data to FormData and wait for a response or send error to console.
	try {
		const formData = new FormData(formEvent);
// give the form data to sendFlips function, which is actually interacting with API
		const flips = await sendFlips({ url, formData });
		console.log(flips);
// present returned data from API
		document.getElementById("heads").innerHTML = "Heads: "+flips.summary.heads;
		document.getElementById("tails").innerHTML = "Tails: "+flips.summary.tails;
// calls a function what will make a list of coin images based on the flips array of coin flips summary
    document.getElementById("coinslist").innerHTML = coinList(flips.raw);
	} catch (error) {
		console.log(error);
	}
}


// sends POST request objects from FormData to send to the API using fetch()
async function sendFlips({ url, formData }) {
    // takes form data from the FormData object
        const plainFormData = Object.fromEntries(formData.entries());
    // converts the FormData into JSON before sending to API
        const formDataJson = JSON.stringify(plainFormData);
    // prints in console for debugging purposes
        console.log(formDataJson);
    // request object for fetch()
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: formDataJson
        };
    // send request and wait for the response
        const response = await fetch(url, options);
    // pass response back to the event handler
        return response.json()
    }
    

    // coinlist function
    function coinList(array) {
        let text = "";
        let arrayLength = array.length
        for (let i = 0; i < arrayLength; i++) {
          text += '<li><img src="assets/img/'+array[i]+'.png" class="bigcoin"></li>';
        }
        return text
      }


// Enter number and press button to activate coin flip series

// Guess a flip by clicking either heads or tails button
