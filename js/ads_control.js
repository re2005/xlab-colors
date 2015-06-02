
(function timer(){
	count = 10;
	counter = setInterval(timer, 1000); //1000 will  run it every 1 second
	function timer() {
		count=count-1;
		if (count <= 0)
		{
			clearInterval(counter);
			closeAd();
			return;
		};
		document.getElementById("counter").innerHTML = count;
	};
})();



function closeAd() {
	clearInterval(counter);
	document.getElementById("ad").remove();
}


(function trigger(){
	var close = document.getElementById("close")
	close.addEventListener('click', function(e) {
		closeAd();
	}, false);

})();