errors = {
	draw: function(code) {
		$("#view").load("/api/error/" + code);
	}
}