droparea            = $('#view')
importqueue         = []
queuestarted        = false

# If you don't apply this to like every event, it doesn't work and you're fucked
cancelEverything    = (e) ->
    e.stopPropagation()
    e.preventDefault()

# The thing that was dropped is a MP3
fileDropped         = (files) ->

    # You can import multiple files at once
    _.each files, (file) ->

        # Label the track als file
        track = 
            type: {provider: 'file', id: file}
            target: determineTarget()

        # Finally, add the track to the queue
        addToImportQueue track

# The thing that was dropped is a YouTube, Spotify etc. link
textDropped         = (text) ->

    # Possibility to add multiple tracks: Split by newline
    links = text.split /\n/

    # Loop through links
    _.each links, (link) ->

        # Label the track as link
        track = 
            type: determineProvider(link)
            target: determineTarget()

        # If provider found, add to queue
        if track.type
            addToImportQueue track

        # ERROR_HANDLING

# Don't know what was dropped
weirdThingDropped   = () ->
    console.log 'something was dropped'

# Get target: Where sould the track be added to? Library or playlist?
determineTarget     = () ->
    document.getElementById('view').dataset.route

determineProvider   = (link) ->

    # Spotify URL's consist of 52 characters and the id at the end is 22 characters long.
    if link.length is 52 and link.substr(0, 30) is 'http://open.spotify.com/track/'
        {provider: 'spotify', id: link.substr 30}

    # YouTube URL's are 
    else if link.substr(0, 28) is 'http://www.youtube.com/watch'
        {provider: 'youtube', id: link. substr 31, 11}
    else 
        false

# Push the track to the import array and notify about changes
addToImportQueue    = (track) ->
    importqueue.push track
    queuechanged()

# Start and stop queue
queuechanged        = () ->

    # If started and no tracks to add, stop queue
    if queuestarted
        if importqueue.length is 0
            stopQueue()

    # If there are tracks, start queue        
    else
        if importqueue.length isnt 0
            startQueue()

# Trigger the recognition            
startQueue          = () ->
    queuestarted = true
    console.log 'Queue started'
    recognizeTracks()

# No tracks left, allow to trigger recognition again    
stopQueue           = () ->
    queuestarted = false
    console.log 'Queue ended'

# Trigger for the whole recognition    
recognizeTracks     = () ->

    # Get the first track and remove it from the array
    firsttrack = importqueue.shift()

    # Pass over to recognizion function
    recognize firsttrack, (song) ->

        # After the whole process, add to library / playlist
        addToCollections firsttrack, song

        # Something happened!
        queuechanged()

        # Continue when there are still tracks left...
        if importqueue.length isnt 0
            recognizeTracks()

# Map to the different recognition processes            
recognize           = (track, callback) ->

    # Spotify
    if track.type.provider is 'spotify'
        recognizeSpotify track, (song) ->
            callback song

    # File        
    else if track.type.provider is 'file'
        recognizeFile track, (song) ->
            callback song

# Go to Spotify server and get track infos
recognizeSpotify    = (track, callback) ->

    # Make AJAX request
    $.getJSON 'http://ws.spotify.com/lookup/1/.json?uri=spotify:track:' + track.type.id, (json) ->
        track =
            name: json.track.name
            artist: json.track.artists[0].name
        # Ask servers for track info    
        socket.emit 'request-track-info', track

        # Receive response, listen only once!
        socket.once 'receive-track-info', (data) ->

            # No track on iTunes found
            if data.error
                callback null

            # Now add YouTube video    
            else
                song = data.song
                recognition.findVideo song, (video) ->
                    song.ytid = helpers.parseYTId video

                    # Upload to servers
                    socket.emit 'new-track', song

                    # If upload confirmed, call back!
                    socket.once 'track-uploaded', (id) ->
                        if id is song.id
                            callback song

recognizeFile       = (track, callback) ->
    reader = new FileReader()
    reader.onload = (e) ->
        dv = new jDataView(this.result)
        if dv.getString(3, dv.byteLength - 128) is 'TAG'
            track =
                name:  dv.getString 30, dv.tell()
                artist: dv.getString 30, dv.tell()
            console.log track
            socket.emit 'request-track-info', track
            socket.once 'receive-track-info', (data) ->
                if data.error
                    console.log 'no track found'
                    callback null
                else
                    song = data.song
                    recognition.findVideo song, (video) ->
                        song.ytid = helpers.parseYTId video
                        socket.emit 'new-track', song
                        socket.once 'track-uploaded', (id) ->
                            if id is song.id
                                callback song
        else
            console.log 'NO ID3'
            callback null
    reader.readAsArrayBuffer track.type.id
addToCollections    = (info, song) ->
    target = info.target
    if song
        if _s.contains(target, '/u/') and _s.contains(target, '/p/')
            socket.emit 'add-song-to-playlist', {token: chinchilla.token, songid: song.id, url: target} 
        else 
            socket.emit 'add-track', {token: chinchilla.token, song: {id: song.id}, destination: 'library'}
$(document).ready () ->

    # Cancel dragenter event
    document.addEventListener 'dragenter', (e) ->
        cancelEverything(e)
    
    
    document.getElementById('dropfiles').addEventListener 'dragleave', () ->
        document.getElementById('dropfiles').className = ''
        document.getElementById('dropfilescontent').className = ''
    
    # Dragover is also fired...
    document.addEventListener 'dragover',  (e) ->
        document.getElementById('dropfiles').className = 'drag-hover'
        document.getElementById('dropfilescontent').className = 'drag-hover'
        cancelEverything(e)
    
    # Finally, here we can handle the dropped files + links
    document.addEventListener 'drop', (e) ->
        document.getElementById('dropfiles').className = ''
        document.getElementById('dropfilescontent').className = ''
        # Again, cancel the event
        cancelEverything(e)
    
        # Determine the type of the dropped thing
        files = e.dataTransfer.files
        text = e.dataTransfer.getData('Text')
        #Files dropped
        if files.length != 0
            fileDropped(files)
    
        # Links dropped
        else if text != ''
            textDropped(text)
    
        # Something different dropped
        else
            weirdThingDropped() 