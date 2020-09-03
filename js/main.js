$("#collage").hide();
$(".toolbar").hide();
$("#loading").hide();
$("#selection").hide();

var coversize = 100;
var pages = 1;
var limit = 50;
var size = 1;
var itemtype = "tracks";
var show_unique = true;
var playlist = "";
var contenttitle = "Covert";

var imgs = [];

function populateView() {
		getAccessToken();
		if (access_token === null) return;
		for(var i=0; i<3; i++) loadPlaylists(10*i);
}

function repopulateView() {
		getAccessToken();
		if (access_token === null) return;
		
		$("#selection").hide();
		$("#collage").hide();
		$("#loading").show();
		var requests = [];
		pages = 10 * size;
		if (itemtype === "saved-albums") {
			contenttitle="Your Albums";
			for(var i=0; i<pages; i++) requests.push(loadAlbumData(limit*i));
		} else if (itemtype === "saved-tracks") {
			pages /= 5;
			contenttitle="Your Songs";
			for(var i=0; i<pages; i++) requests.push(loadTrackData(limit*i));
		} else if (itemtype === "playlist") {
			for(var i=0; i<pages; i++) requests.push(loadPlaylistData(playlist, limit*i));
		} else {
			contenttitle = (itemtype === "artists") ? "Your Top Artists" : "Your Top Songs";
			if (size > 1) pages /= 3;
			for(var i=0; i<pages; i++) requests.push(loadTopData(itemtype, "short_term", limit*i));
			for(var i=0; i<pages; i++) requests.push(loadTopData(itemtype, "medium_term", limit*i));
			for(var i=0; i<pages; i++) requests.push(loadTopData(itemtype, "long_term", limit*i));
		}
		$.when.apply($, requests).then(showCollage);
}

function toolbarUpdate() {
		imgs = [];
		repopulateView();
}

function getAccessToken() {
		access_token = sessionStorage.getItem("accessToken");
		if (access_token !== null) {
			signedIn();
			return;
		}
		if (window.location.hash !== "") {
				var url = new URL(window.location.href);
				access_token = location.hash.match(new RegExp('access_token=([^&]*)'))[1];
				signedIn();
				//console.log("Access Token: " + access_token);
				if (typeof(Storage) !== "undefined") {
						sessionStorage.setItem("accessToken", access_token);
				} else {
						alert("Your browser does not support web storage...\nPlease try another browser.");
				}
		} else {
				$("#authbutton").html("Sign in");
		}
}

function signedIn() {	
		$(".toolbar").show();
		$("#authbutton").html("Sign out");
		$("#alert").hide();
}

// Toggle sign-in state.
function authorize() {
		if (sessionStorage.getItem("accessToken") === null) {
				$(location).attr('href', 'https://accounts.spotify.com/authorize?client_id=f0c79addfc5948f4ae64df21edf09c83&scope=user-top-read user-library-read&response_type=token&redirect_uri=https://niklasbuehler.github.io/covert');
		} else {
				sessionStorage.clear();
				location.href = "index.html";
		}
}

function loadPlaylists(offset) {
	return request = $.ajax({
			url: "https://api.spotify.com/v1/me/playlists?limit=10&offset="+offset,
			beforeSend: function(xhr) {
					xhr.setRequestHeader("Authorization", "Bearer "+access_token)
			}, success: function(data){
					data.items.forEach(playlist => $("#type-picker").append('<a class="dropdown-item" href="#" onclick="itemtype=\'playlist\'; playlist=\''+playlist.id+'\'; contenttitle=\'Your Playlist '+playlist.name+'\'; toolbarUpdate()">'+playlist.name+'</a>'));
					data.items.forEach(playlist => $("#selection").append('<a class="imagebutton" style="background-image: url(\''+playlist.images[0]["url"]+'\')" href="#" onclick="itemtype=\'playlist\'; playlist=\''+playlist.id+'\'; contenttitle=\'Your Playlist '+playlist.name+'\'; toolbarUpdate()"></a>'));
					//data.items.map(item => console.log(item.name));
					$("#selection").show();
			}, failure: function() {
						return false;
			}
	});
}

function loadPlaylistData(playlistID, offset) {
		if (access_token === null) return null;
		return request = $.ajax({
				url: "https://api.spotify.com/v1/playlists/"+playlistID+"/tracks?limit="+limit+"&offset="+offset,
				beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Bearer "+access_token)
				}, success: function(data){
						var newimages = data.items.map(item => item.track.album.images[0]);
						//data.items.map(item => console.log(item.name));
						newimages.forEach(image => imgs.push(image));
						return true;
				}, failure: function() {
						return false;
				}
		});
}

function loadTrackData(offset) {
		if (access_token === null) return null;
		return $.ajax({
				url: "https://api.spotify.com/v1/me/tracks?limit="+limit+"&offset="+offset,
				beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Bearer "+access_token)
				}, success: function(data){
						var newimages = data.items.map(item => item.track.album.images[0]);
						//data.items.map(item => console.log(item.name));
						newimages.forEach(image => imgs.push(image));
						return true;
				}, failure: function() {
						return false;
				}
		});
}

function loadAlbumData(offset) {
		if (access_token === null) return null;
		return $.ajax({
				url: "https://api.spotify.com/v1/me/albums?limit="+limit+"&offset="+offset,
				beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Bearer "+access_token)
				}, success: function(data){
						//console.log(data.items);
						var newimages = data.items.map(item => item.album.images[0]);
						//data.items.map(item => console.log(item.name));
						newimages.forEach(image => imgs.push(image));
						return true;
				}, failure: function() {
						return false;
				}
		});
}

function loadTopData(itemtype, timeframe, offset) {
		if (access_token === null) return null;
		return $.ajax({
				url: "https://api.spotify.com/v1/me/top/"+itemtype+"?time_range="+timeframe+"&limit="+limit+"&offset="+offset,
				beforeSend: function(xhr) {
						xhr.setRequestHeader("Authorization", "Bearer "+access_token)
				}, success: function(data){
						var newimages = null;
						if (itemtype === "artists") {
							newimages = data.items.map(artist => artist.images[0]);
						} else {
							newimages = data.items.map(track => track.album.images[0]);
						}
						//data.items.map(item => console.log(item.name));
						newimages.forEach(image => imgs.push(image));
						return true;
				}, failure: function() {
						return false;
				}
		});
}

function showCollage() {
		$("#title").html(contenttitle);
		$("#collage").show(); // has to be visible before executing fillCollage!
		var unique = imgs.filter((v,i,a)=>a.findIndex(t=>(t["url"] === v["url"]))===i);
		if (show_unique) {
			fillCollage(unique);
		} else {
			fillCollage(imgs);
		}
		$("#loading").hide();
}

function fillCollage(photos) {
		$('#collage').empty().justifiedImages({
				images : photos,
				rowHeight: coversize,
				maxRowHeight: 2*coversize,
				thumbnailPath: function(photo, width, height){
						return photo["url"];
				},
				getSize: function(photo){
						return {width: photo.width, height: photo.height};
				},
				margin: 1
		});
}

function logOut() {
	sessionStorage.clear();
}
