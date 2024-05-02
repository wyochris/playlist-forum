var rhit = rhit || {};

rhit.main = function () {
	console.log("Ready");
	document.getElementById("songsButton").onclick = (event) => {
		window.location.href = `/songs.html`;
	};
	document.getElementById("playlistsButton").onclick = (event) => {
		window.location.href = `/index.html`;
	};
};

rhit.main();
