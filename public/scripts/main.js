const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"

var rhit = rhit || {};

rhit.FB_COLLECTION_PLAYLIST = "Playlists";
rhit.FB_COLLECTION_COMMENTS = "Comments";
FB_COLLECTION_SONG = "songs";
rhit.FB_KEY_PLAYLISTNAME = "playlistName";
rhit.FB_KEY_COMMENTER = "Commenter";
rhit.FB_KEY_CONTENT = "Content";
rhit.FB_KEY_LAST_TOUCHED = "Modified";
rhit.playlistManager = null;
rhit.songPageManager = null;
rhit.authManager = null;
rhit.songPageManagerSong = null;

FB_COLLECTION_PLAYLIST = "Playlists";
FB_KEY_PLAYLISTNAME = "playlistName";
rhit.FB_KEY_AUTHOR = "author";

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

Playlist = class {
	constructor(id, name) {
		this.id = id;
		this.playlistName = name;
	}
}

Song = class {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
}

Comment = class {
	constructor(user, time, content) {
		this.user = user;
		this.time = time;
		this.content = content;
	}
}

AuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		Rosefire.signIn("91f2b267-d3e6-4c22-bc2d-6413401314f6", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			// Next use the Rosefire token with Firebase auth.
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				if (error.code === 'auth/invalid-custom-token') {
					console.log("The token you provided is not valid.");
				} else {
					console.log("signInWithCustomToken error", error.message);
				}
			});
		});


	}
	signOut() {
		firebase.auth().signOut();
		window.location.href = `/home.html`;

	}
	get uid() {
		return this._user.uid;
	}
	get isSignedIn() {
		return !!this._user;
	}

	get username() {
		if(this._user.isAnonymous){
			return "Anonymous";
		} else {
			return this._user.uid;
		}		
	}
}

rhit.PlaylistPageController = class {
	constructor() {
		document.getElementById("playlistsButton").onclick = (event) => {
			window.location.href = `/index.html`;
		};
		
		document.querySelector("#logOutButton").onclick = (event) => {
			rhit.authManager.signOut();
		};
		
		document.querySelector("#logInButton").onclick = (event) => {
			rhit.authManager.signIn();
		};
		
		document.querySelector("#submit").onclick = (event) => {
			const playlistName = document.querySelector("#playlistName").value;
			console.log(playlistName);
			rhit.playlistManager.add(playlistName);
		};
		
		$("#addPlaylist").on("show.bs.modal", (event) => {
			document.querySelector("#playlistName").value = "";
		});
		$("#addPlaylist").on("shown.bs.modal", (event) => {
			document.getElementById("playlistName").focus();
		});
		
		rhit.playlistManager.beginListening(this.updateList.bind(this));
	}
	
	_createCard(pl) {
		//console.log(mq.quote);
		return htmlToElement(`<div class="card">
		<div class="card-body">
		<image src="https://i.scdn.co/image/ab67616d0000485102d63d77b84d4927a80d5252">&nbsp; ${pl.playlistName}</image>
		</div>
		</div>`);
	}
	
	updateList() {
		const newList = htmlToElement('<div id="listContainer"></div>');
		for (let i = 0; i < rhit.playlistManager.length; i++) {
			const pl = rhit.playlistManager.getPlaylistAtIndex(i);
			const newCard = this._createCard(pl);
			newCard.onclick = (event) => {
				window.location.href = `/songs.html?pid=${pl.id}`;
			};
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#listContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		
		oldList.parentElement.appendChild(newList);
		
		if(rhit.authManager.isSignedIn){
			document.querySelector("#logOutButton").style.display = "block";
			document.querySelector("#logInButton").style.display = "none";
		}
	}
}

rhit.PlaylistManager = class {
    constructor(uid) {
        this._uid = uid;
        this._documentSnapshots = [];
        this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PLAYLIST);
        this._unsubscribe = null;
    }
	
	add(playlistName) {
		this._ref.add({
			[rhit.FB_KEY_AUTHOR]: rhit.authManager.uid,
			[rhit.FB_KEY_PLAYLISTNAME]: playlistName,
		})
	}
	
    beginListening(changeListener) {
		console.log("Author Key:", rhit.FB_KEY_AUTHOR);
		console.log("User ID:", this._uid);

        let query = this._ref.where(rhit.FB_KEY_AUTHOR, "==", this._uid).limit(50);

        this._unsubscribe = query.onSnapshot((querySnapshot) => {
            this._documentSnapshots = querySnapshot.docs;
            changeListener();
        });
    }
	
	stopListening() {
		this._unsubscribe();
	}
	
	get length() {
		return this._documentSnapshots.length;
	}
	
	getPlaylistAtIndex(index) {
		const snap = this._documentSnapshots[index];
		const pl = new Playlist(
			snap.id,
			snap.get(FB_KEY_PLAYLISTNAME),
		);
		console.log(pl.id + ", " + pl.playlistName);
		return pl;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#mainPage")) {
        rhit.authManager.beginListening(() => {
            if (rhit.authManager.isSignedIn) {
                rhit.playlistManager = new rhit.PlaylistManager(rhit.authManager.uid);
                new rhit.PlaylistPageController();
            } else {
                console.log("User is not signed in.");
            }
        });
    }
	
	if (document.querySelector("#songsPage")) {
		const pid = urlParams.get("pid");
		rhit.songPageManagerSong = new rhit.SongPageManagerSong(pid);
		
		new rhit.SongPageControllerSong();
	}
	
	if (document.querySelector("#detailsPage")) {
		const pid = urlParams.get("pid");
		const sid = urlParams.get("sid");
		
		new rhit.DetailsPageManager(pid, sid);
	}

	if (document.querySelector("#loginPage")) {
		console.log("On the login page");
		new rhit.HomePageManager();
	}
};


rhit.main = function () {
	console.log("Ready");
	rhit.authManager = new AuthManager();
	rhit.authManager.beginListening(() => {
		console.log(`The auth state has changed. Is signed in: ${rhit.authManager.isSignedIn}`);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();

rhit.checkForRedirects = function () {
	// Redirects
	if (document.querySelector("#loginPage") && rhit.authManager.isSignedIn) {
		window.location.href = "/index.html";
	}
	if (!document.querySelector("#loginPage") && !rhit.authManager.isSignedIn) {
		window.location.href = "/home.html";
	}
}


document.addEventListener('DOMContentLoaded', function () {
	console.log("DOM ready");
	
	const searchForm = document.getElementById("searchForm");
	if (searchForm) {
		new ResultPageManager();
	}
	
	setupNavigation();
});

function setupNavigation() {
	const buttons = {
		songsButton: "/songs.html",
		playlistsButton: "/index.html",
		detailsButton: "/details.html",
		resultsButton: "/results.html"
	};
	
	Object.keys(buttons).forEach(buttonId => {
		const button = document.getElementById(buttonId);
		if (button) {
			button.onclick = () => {
				window.location.href = buttons[buttonId];
			};
		}
	});
}

ResultPageManager = class {
	constructor() {
		document.getElementById("searchForm").onsubmit = (event) => {
			event.preventDefault();
			console.log("Form submitted")
			this.handleSearch();
		};
		document.querySelector("#logOutButton").style.display = "block";

		document.querySelector("#logOutButton").onclick = (event) => {
			rhit.authManager.signOut();
		};

	}

	
	handleSearch() {
		const searchQuery = document.getElementById('searchInput').value;
		console.log('handle search start');
		showNotification("searching...", 1000);

		this.updateSongCards(searchQuery);
		document.getElementById('searchInput').value = '';
	}
	
	updateSongCards(searchQuery) {
		console.log('querying API');
		fetch(`https://us-central1-lardner-zhang-final-csse280.cloudfunctions.net/api/search/${searchQuery}`)
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok: ' + response.statusText);
			}
			return response.json();
		})
		.then(data => {
			console.log('API response:', data);
			// data is an array
			const searchResultsContainer = document.getElementById('searchResults');
			searchResultsContainer.innerHTML = '';
			if (Array.isArray(data)) {
				data.forEach((track, index) => {
					const card = this.createSongCard(track);
					
					if (index === data.length - 1) {
						card.classList.add('last-card'); // for css
					}
					
					searchResultsContainer.appendChild(card);
					
				});
			} else {
				throw new Error('Unexpected data format');
			}
		})
		.catch(error => {
			console.error('Error updating song cards:', error);
		});
	}
	
	createSongCard(track) {
		const card = document.createElement('div');
		card.className = 'card d-flex flex-row align-items-center justify-content-between';
		
		const cardBody = document.createElement('div');
		cardBody.className = 'card-body';
		cardBody.style.display = 'flex';
		cardBody.style.alignItems = 'center';
		
		const image = document.createElement('img');
		image.src = track.album.images[0].url;
		image.className = 'img-fluid';
		image.style.width = '100px';
		image.style.height = '100px';
		image.style.marginRight = '20px';
		cardBody.appendChild(image);
		
		const textContent = document.createElement('div');
		
		const songTitle = document.createElement('h5');
		songTitle.className = 'card-title';
		songTitle.textContent = track.name;
		textContent.appendChild(songTitle);
		
		if (track.artists && track.artists.length > 0) {
			const artistName = document.createElement('p');
			artistName.className = 'card-text';
			artistName.textContent = "Artist: " + track.artists.map(artist => artist.name).join(", ");
			textContent.appendChild(artistName);
		}
		
		cardBody.appendChild(textContent);
		card.appendChild(cardBody);
		
		const dropdown = document.createElement('div');
		dropdown.className = 'dropdown';
		
		const dropButton = document.createElement('button');
		dropButton.className = 'btn btn-secondary dropdown-toggle btn-outline-primary';
		dropButton.type = 'button';
		dropButton.id = 'dropdownMenuButton';
		dropButton.dataset.toggle = 'dropdown';
		dropButton.innerText = '+';
		
		const dropdownMenu = document.createElement('div');
		dropdownMenu.className = 'dropdown-menu';
		dropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton');
		
		// Function to populate dropdown
		this.populateDropdown(dropdownMenu, track);
		
		dropdown.appendChild(dropButton);
		dropdown.appendChild(dropdownMenu);
		card.appendChild(dropdown);
		
		return card;
	}
	
	// firebase things
	populateDropdown(menu, track) {
		const db = firebase.firestore();
		const userUID = rhit.authManager.uid;  // hopefully?
	
		db.collection('Playlists').where(rhit.FB_KEY_AUTHOR, "==", userUID).get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				const playlistName = doc.data().playlistName;  
				const option = document.createElement('a');
				option.className = 'dropdown-item';
				option.href = '#';
				option.textContent = playlistName;
				option.onclick = () => this.addSongToPlaylist(track, doc.id);  // Use the document ID
				menu.appendChild(option);
			});
		}).catch(error => {
			console.error("Error getting playlists:", error);
		});
	}
	
	//firebase things
	addSongToPlaylist(track, playlistId) {
		const db = firebase.firestore();
		const playlistRef = db.collection('Playlists').doc(playlistId);
		console.log(track);
		console.log(track.type);
		
		const songData = {
			spotifyId: track.id,
			title: track.name,
			// artist: track.artists[0].name, // only first
			artist: track.artists.map(artist => artist.name).join(", "), // more than one
			albumName: track.album.name,
			albumImageUrl: track.album.images[0].url,
			releaseDate: track.album.release_date,
			trackNumber: track.track_number,
			durationMs: track.duration_ms,
			previewUrl: track.preview_url,
			popularity: track.popularity,
			explicit: track.explicit,
			addedOn: new Date() // Timestamp
		};
		
		// Check if the song already exists in the playlist
		playlistRef.collection('songs').doc(track.id).get().then(doc => {
			if (!doc.exists) {
				// If not, add it
				playlistRef.collection('songs').doc(track.id).set(songData)
				.then(() => {
					console.log('Song added to playlist successfully!');
					showNotification("added song to playlist");

				})
				.catch(error => {
					console.error('Error adding song to playlist:', error);
				});
			} else {
				console.log('Song already exists in the playlist');
			}
		});
	}

	
	
}

rhit.DetailsPageManager = class {
	constructor(playlistID, songID) {
		this.db = firebase.firestore();
		this.playlistID = playlistID
		this.songID = songID
		this.songs = []; // use init songs function
		this.currentIndex = 0;
		this.initializeSongs();
		document.querySelector("#logOutButton").style.display = "block";

		document.querySelector("#logOutButton").onclick = (event) => {
			rhit.authManager.signOut();
		};
	}
	
	async initializeSongs() {
		// get all songs in the playlist once
		const songsSnapshot = await this.db.collection('Playlists').doc(this.playlistID)
		.collection('songs').get();
		this.songs = songsSnapshot.docs.map(doc => doc.id);
		this.currentIndex = this.songs.indexOf(this.songID);
		this.loadSong(this.songID);
	}
	
	async loadSong(songID) {
		const songDoc = await this.db.collection('Playlists').doc(this.playlistID)
		.collection('songs').doc(songID).get();
		if (songDoc.exists) {
			await this.displaySongDetails(songDoc.data());
			this.currentSongID = songID; //current song ID
			this.updateNavigationButtons();
		} else {
			console.log('No song found with the given ID');
		}
	}
	
	updateNavigationButtons() {
		// Update previous song button
		const prevButton = document.getElementById('prev-song');
		if (this.currentIndex > 0) {
			prevButton.style.display = 'block';
			prevButton.onclick = () => {
				this.currentIndex--;
				this.loadSong(this.songs[this.currentIndex]);
			};
		} else {
			prevButton.style.display = 'none';
		}
		
		// Update next song button
		const nextButton = document.getElementById('next-song');
		if (this.currentIndex < this.songs.length - 1) {
			nextButton.style.display = 'block';
			nextButton.onclick = () => {
				this.currentIndex++;
				this.loadSong(this.songs[this.currentIndex]);
			};
		} else {
			nextButton.style.display = 'none';
		}
		
		document.getElementById('song-position').textContent = `Song ${this.currentIndex + 1} of ${this.songs.length}`;
	}
	
	async displaySongDetails(songData) {
		document.querySelector('.album-art').src = songData.albumImageUrl;
		document.querySelector('.album-art').alt = `${songData.title} album cover`;
		document.querySelector('.song-title').textContent = songData.title;
		document.querySelector('.song-artist').textContent = songData.artist;
		document.getElementById('release-date').textContent = songData.releaseDate;
		document.getElementById('popularity').textContent = songData.popularity + "/100";
		document.getElementById('added-on').textContent = new Date(songData.addedOn.seconds * 1000).toLocaleDateString();
		document.getElementById('album-title').textContent = songData.albumName;
		
		//audio preview
		const audio = document.getElementById('audio-preview');
		audio.querySelector('source').src = songData.previewUrl;
		audio.load(); // Refresh

		const deleteButton = document.querySelector('#delete-song');
		deleteButton.onclick = async () => await this.deleteSong();
	}

	async deleteSong() {
		if (confirm("Are you sure you want to delete this song?")) {
			try {
				await this.db.collection('Playlists').doc(this.playlistID)
					.collection('songs').doc(this.songs[this.currentIndex]).delete();
				
				console.log('Song deleted successfully');
				this.songs.splice(this.currentIndex, 1); // Remove the song from the array
				if (this.songs.length > 0) {
					this.currentIndex = Math.max(this.currentIndex - 1, 0);
					this.loadSong(this.songs[this.currentIndex]);
				} else {
					console.log('No songs left in the playlist');
					// TODO
				}
				this.updateNavigationButtons();
			} catch (error) {
				console.error('Error deleting song: ', error);
			}
		}
	}
}

rhit.SongPageManagerSong = class {
	constructor(pid) {
		this._pid = pid;
		this._documentSnapshots = [];
		this._commentSnapshots = [];
		this._songRef = firebase.firestore().collection("Playlists").doc(pid).collection("songs");
		this._commRef = firebase.firestore().collection("Playlists").doc(pid).collection("Comments");
		this._playlistName = firebase.firestore().collection("Playlists").doc(pid).playlistName;
		this._unsubscribe = null;
		this._unsubscribeComment = null;
	}
	
	async addSong(songData) {
		const querySnapshot = await this._songRef.get();
		this._currentIndex = querySnapshot.size + 1;
		
		return this._songRef.add(songData).then(docRef => {
			console.log(`Added song with ID: ${docRef.id} and song number: ${this._currentIndex}`);
		}).catch(error => {
			console.error("Error adding song: ", error);
		});
	}
	
	addComment(content) {
		console.log("adding " + content);

		//const date=new Date(firebase.firestore.Timestamp.now());
		//const sfd = new SimpleDateFormat("dd-MM-yyyy HH:mm:ss");

		this._commRef.add({
			[rhit.FB_KEY_COMMENTER]: rhit.authManager.username,
			[rhit.FB_KEY_CONTENT]: content,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})

		showNotification("added a comment");
	}
	
	beginListeningComment(changeListener) {
		console.log("listening for comments");
		let query = this._commRef
		.limit(50);
		
		this._unsubscribeComment = query.onSnapshot((querySnapshot) => {
			this._commentSnapshots = querySnapshot.docs;
			changeListener();
		});
		console.log("listening done");
	}
	
	stopListeningComment() {
		this._unsubscribeComment();
	}
	
	get commentLength() {
		return this._commentSnapshots.length;
	}
	
	beginListening(changeListener) {
		this._unsubscribe = this._songRef.orderBy("trackNumber").onSnapshot(querySnapshot => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	
	stopListening() {
		this._unsubscribe();
	}
	
    async getPlaylistTitle() {
        try {
            const docSnapshot = await firebase.firestore().collection('Playlists').doc(this._pid).get();
            if (docSnapshot.exists) {
                return docSnapshot.data().playlistName;
            } else {
                console.error('No such playlist!');
                return 'Playlist Title Error'; // dsfdsf
            }
        } catch (error) {
            console.error('Error getting playlist:', error);
            return 'Playlist Title Error'; // dsfsdf
        }
    }
	
	get length() {
		return this._documentSnapshots.length;
	}
	
	getComment(index) {
		const snap = this._commentSnapshots[index];
		const date = snap.get(rhit.FB_KEY_LAST_TOUCHED).toDate();

		const cm = new Comment(
			snap.get(rhit.FB_KEY_COMMENTER),
			date,	
			snap.get(rhit.FB_KEY_CONTENT),				
		);
		// console.log(cm.time);
		return cm;
	}
	
	
	getSong(index) {
		const doc = this._documentSnapshots[index];
		return {
			songNum: doc.data().songNum,
			title: doc.data().title,
			artist: doc.data().artist,
			albumImageUrl: doc.data().albumImageUrl,
			id: doc.id,  // Assuming doc.id is the song's unique ID
			pid: this._pid  // Maintain this when initializing the manager
		};
	}

	async fetchPlaylistName() {
		try {
			const playlistDoc = await this._playlistNameRef.doc(this._pid).get();
			if (playlistDoc.exists) {
				console.log("Playlist Name:", playlistDoc.data().playlistName);
				return playlistDoc.data().playlistName;
			} else {
				console.log("Playlist document not found!");
				return "Unknown Playlist";  // Fallback playlist name
			}
		} catch (error) {
			console.error("Error getting playlist name:", error);
			return "Error Loading Playlist";
		}
	}
	
}


rhit.SongPageControllerSong = class {
	constructor() {
		
		document.querySelector("#addCommentButton").onclick = (event) => {
			const content = document.querySelector("#commentContent").value;
			console.log(content);
			rhit.songPageManagerSong.addComment(content);
			const comment = document.querySelector("#commentContent");
			comment.value = "";
		};
		
		// document.querySelector("#logOutButton").onclick = (event) => {
		// 	rhit.authManager.signOut();
		// 	window.location.reload();
		// };
		document.querySelector("#logOutButton").style.display = "block";

		document.querySelector("#logOutButton").onclick = (event) => {
			rhit.authManager.signOut();
		};
		
		
		rhit.songPageManagerSong.beginListening(this.updateView.bind(this));
		rhit.songPageManagerSong.beginListeningComment(this.updateView.bind(this));
	}
	
	async updateView() {
		console.log("updating view");
		const songContainer = document.querySelector("#songs");
		songContainer.innerHTML = ''; // Clear existing content
		
		for (let i = 0; i < rhit.songPageManagerSong.length; i++) {
			const song = rhit.songPageManagerSong.getSong(i);
			const songCard = this._createSongCard(song);
			songContainer.appendChild(songCard);
		}
		
		document.querySelector("#playlistTitle").innerText = await rhit.songPageManagerSong.getPlaylistTitle();
		
		const commentContainer = document.querySelector("#commentContainer");
		commentContainer.innerHTML = ''; 
		console.log(rhit.songPageManagerSong.commentLength);
		for (let i = 0; i < rhit.songPageManagerSong.commentLength; i++) {
			const comment = rhit.songPageManagerSong.getComment(i);
			const cmCard = this._createComment(comment);
			commentContainer.appendChild(cmCard);
			// console.log("made a comment");
		}
		
		// if(!rhit.authManager.user.isAnonymous){
		// 	document.querySelector("#logOutButton").style.display = "block";
		// 	document.querySelector("#logInButton").style.display = "none";
		// }
	}
	
	_createSongCard(song) {
		
		const card = document.createElement('div');
		card.className = 'card d-flex flex-row align-items-center justify-content-between';
		
		const cardBody = document.createElement('div');
		cardBody.className = 'card-body';
		cardBody.style.display = 'flex';
		cardBody.style.alignItems = 'center';
		
		const image = document.createElement('img');
		image.src = song.albumImageUrl;
		image.className = 'img-fluid';
		image.style.width = '100px';
		image.style.height = '100px';
		image.style.marginRight = '20px';
		cardBody.appendChild(image);
		
		const textContent = document.createElement('div');
		
		const songTitle = document.createElement('h5');
		songTitle.className = 'card-title';
		songTitle.textContent = song.title;
		textContent.appendChild(songTitle);
		
		const artistName = document.createElement('p');
		artistName.className = 'card-text';
		artistName.textContent = song.artist;
		textContent.appendChild(artistName);
		
		cardBody.appendChild(textContent);
		card.appendChild(cardBody);
		
		const detailsButton = document.createElement('button');
		detailsButton.className = 'btn btn-secondary btn-outline-primary';
		detailsButton.type = 'button';
		detailsButton.innerText = 'info'
		detailsButton.id = 'detailsButtonCard';
		
		detailsButton.onclick = () => {
			console.log("Details button clicked for song:", song.title); // TODO
			window.location.href = `/details.html?pid=${song.pid}&sid=${song.id}`;
		};
		
		card.appendChild(detailsButton);
		
		return card;
	}
	
	_createComment(cm) {
		// console.log("creating" + cm.content);
		let displayName = 'Unknown User'; // Default name in case the fetch fails
		if(cm.user.length > 15){
			displayName = 'Anonymous';
		}
		else {
			displayName = cm.user;
		}

		return htmlToElement(`<div class="card">
		<div class="card-body">
		<image class="profile-picture" src="https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj"></image>
		
		<div id="author">${displayName} | ${ cm.time.toLocaleDateString() + ' ' + cm.time.toLocaleTimeString()} <br> <br> ${cm.content} </div>

		</div>`);
	}
	
}

rhit.HomePageManager = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.authManager.signIn();
		};
	}
}


function showNotification(message, time=3000) {
    var notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(function() {
        notification.style.display = 'none';
    }, time);
}
