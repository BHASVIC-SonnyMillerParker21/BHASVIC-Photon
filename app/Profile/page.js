"use client";
import React, {useEffect, useState} from 'react';
import './Profile.css';
import './Graph.css'
import {getPlaylists, retrieveDatapoint, retrieveUser} from '../PDM';
import arrow from '../../public/Arrow.png'
import {Chip} from '@mui/material';
import {createTheme} from '@mui/material/styles';
import {ThemeProvider} from '@emotion/react';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PersonIcon from '@mui/icons-material/Person';


const Page = () => {

    const theme = createTheme({
        palette: {
            primary: {
                main: '#22C55E',
            },

        },
    });
    const [userID, setUserID] = useState(window.location.hash.split("#")[1]);
    const [loaded, setLoaded] = useState(false);
    let [currentUser, setCurrentUser] = useState({
        userID: '',
        username: '',
        profilePicture: '',
        media: {name: '', image: ''},
    });
    let [datapoint, setDatapoint] = useState({
        userID: '',
        collectionDate: '',
        term: '',
        topSongs: [],
        topArtists: [],
        topGenres: [],
    });
    let [term, setTerm] = useState("long_term");
    const terms = ["short_term", "medium_term", "long_term"];
    let [chipletData, setChipletData] = useState(false)
    const [showArt, setShowArt] = useState("empty")
    const [focus, setFocus] = useState({
        item: null,
        title: '', //main text
        secondary: '', //sub-title
        tertiary: '', //desc
        image: '',
        link: '',
    })
    const [artistQualities, setArtistQualities] = useState();
    const [focusMessage, setFocusMessage] = useState("See what it says.");
    // The datapoint we are currently on
    const [simpleSelection, setSimpleSelection] = useState("Artists")
    const [playlists, setPlaylists] = useState([])
    const simpleDatapoints = ["Artists", "Songs", "Genres"]
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
    // Take it to be "X music"
    const translateAnalytics = {
        acousticness: 'acoustic',
        danceability: 'danceable',
        energy: 'energetic',
        instrumentalness: 'instrumental',
        liveness: 'live',
        loudness: 'loud',
        valence: 'positive',
        tempo: `high tempo`
    }
    // Get the display name of the list item
    const getLIName = function (data) {
        let result;
        switch (data.type) {
            case "artist":
                result = data.name;
                break;
            case "song":
                result = data.title;
                break;
            case undefined:
                result = data;
                break;
            default:
                console.warn("getLIName error: No name returned.");
                break;
        }
        if (result.length > 20) {
            result = result.substring(0, 20) + "..."
        }
        return result;
    }
    // Change the simple datapoint +1
    const incrementSimple = function () {
        setShowArt("empty")
        setFocus({
            item: null,
            title: '', //main text
            secondary: '', //sub-title
            tertiary: '', //desc
            image: '',
            link: '',
        })
        setFocusMessage("See what it says.")
        const index = simpleDatapoints.indexOf(simpleSelection);
        index === 2 ? setSimpleSelection(simpleDatapoints[0]) : setSimpleSelection(simpleDatapoints[index + 1]);
    }
    // Change the simple datapoint -1
    const decrementSimple = function () {
        setShowArt("empty")
        setFocus({
            item: null,
            title: '', //main text
            secondary: '', //sub-title
            tertiary: '', //desc
            image: '',
            link: '',
        })
        setFocusMessage("See what it says.")
        const index = simpleDatapoints.indexOf(simpleSelection);
        index === 0 ? setSimpleSelection(simpleDatapoints[2]) : setSimpleSelection(simpleDatapoints[index - 1]);
    }
    // Update the artist attributes that are used to make the foucs
    // message.
    const updateArtistQualities = async function (data) {
        const songs = data.topSongs;
        const artists = data.topArtists;
        const genres = data.topGenres;
        let result = {};
        // The analytics from the datapoint that we will compare
        // Get the artist that has the max value in each
        // metric
        analyticsMetrics.forEach(metric => {
            let max = {artist: '', value: 0};
            for (let i = 0; i < 50; i++) {
                if (songs[i].analytics[metric] > max.value) {
                    max.artist = songs[i].artist;
                    max.value = songs[i].analytics[metric];
                }
            }
            // Append the result to the existing result object
            result = {
                ...result,
                [max.artist]: {theme: metric}
            }
        })
        // For every artist [in order of listen time]
        await artists.forEach(async artist => {
            // Add the genre quality to them
            // equal to their genre
            if (genres.includes(artist.genre)) {
                result[artist.name] = {
                    ...result[artist.name],
                    genre: artist.genre
                }
            }
        })
        setArtistQualities(result);
    }
    // Update the focus message to be
    // relevant to the current focus
    const updateFocusMessage = async function () {
        // What do we use as our possessive? 
        let possessive;
        userID === 'me' ? possessive = 'your' : possessive = `${currentUser.username}'s`
        const item = focus.item;
        let message = '';
        switch (item.type) {
            case "artist":
                if (artistQualities[`${item.name}`] === undefined) {
                    // If the artist doesn't have a genre analysis then we assume
                    // that they are not wildly popular.
                    message += `${item.name} is a rare to see artist. They make ${possessive} profile quite unique.`
                } else {
                    Object.keys(artistQualities[item.name]).length > 1 ?
                        message += `${item.name} not only represents ${possessive} love for ${artistQualities[item.name]["genre"]} music, but also for ${translateAnalytics[artistQualities[item.name]["theme"]]} music.`
                        :
                        message += `${item.name} is the artist that defines ${possessive} love for ${artistQualities[item.name][Object.keys(artistQualities[item.name])[0]]} music.`
                }
                break;
            case "song":
                // TODO: MAKE THIS A MORE ACCURATE
                let maxAnalytic = "acousticness";
                analyticsMetrics.forEach(analytic => {
                    let comparisonValue;
                    if (analytic === "tempo") {
                        comparisonValue = (item.analytics[analytic] - 50) / 150
                    } else {
                        comparisonValue = item.analytics[analytic]
                    }
                    if (comparisonValue > item.analytics[maxAnalytic]) {
                        maxAnalytic = analytic;
                    }
                })
                message += `${item.title} is a very ${translateAnalytics[maxAnalytic]} song by ${item.artist}.`
                break;
            case undefined:
                let relevantArtists = [];
                for (let artist in artistQualities) {
                    if (artistQualities[artist].genre === item) {
                        relevantArtists.push(artist);
                    }
                }
                datapoint.topArtists.forEach(artist => {
                    if (artist.genre === item && !relevantArtists.includes(artist.name)) {
                        relevantArtists.push(artist.name)
                    }
                });
                relevantArtists.length > 1 ?
                    //          Capitalise the possessive
                    message += `${possessive[0].toUpperCase() + possessive.substring(1)} love for ${item} is not only defined by ${possessive} love for ${relevantArtists[0]} but also ${relevantArtists.length - 1} other artist${relevantArtists.length - 1 === 1 ? `, ${relevantArtists[1]}` : "s"}.`
                    :
                    (relevantArtists.length === 1 ?
                            message += `${possessive[0].toUpperCase() + possessive.substring(1)} love for ${item} is very well marked by ${possessive} time listening to ${relevantArtists[0]}.`
                            :    //TODO: THIS OCCURS WAYYY TOO OFTEN
                            message += `${possessive[0].toUpperCase() + possessive.substring(1)} taste in ${item} music isn't well defined by one artist, it's the product of many songs over many artists.`
                    )
                break;
            default:
                console.warn("updateFocusMessage error: No focus type found.")
        }
        setFocusMessage(message);
    }
    // Construct the description for an item in a graph.
    const getGraphQualities = (val1, type1, val2, type2) => {
        let message = "";
        if (val1 > 75) {
            message += `high ${type1}`;
        } else if (val1 > 25) {
            message += `medium ${type1}`;
        } else {
            message += `low ${type1}`;
        }
        if (val2) {
            message += ", ";
            message += getGraphQualities(val2, type2);
        }
        return message;
    }
    // TODO: FIND A WAY TO INCLUDE THIS INTO THE GRAPH COMPONENT
    const [graphAxis, setGraphAxis] = useState({
        x: "danceability",
        y: "energy"
    })
    /**
     * The Graph is a dynamic component that creates a scatter plot
     * from an array of objects. Its title is the in the format "{title} X vs Y".
     * The keys can be changed using a drop-down menu and the array of
     * these keys can be passed in as selections.
     * @param props title, key, list, parentObject and selections.
     * @returns {JSX.Element} HTML for a graph.
     * @constructor
     */
    const Graph = (props) => {
        const key = props.key;
        const list = props.data;
        const parentObj = props.parent;
        const selections = props.selections;
        const title = props.title;
        let maxX;
        let minX;
        if (graphAxis.x === "tempo") {
            minX = 50;
            maxX = 200
        } else {
            minX = 0;
            maxX = 1
        }
        let maxY;
        let minY;
        if (graphAxis.y === "tempo") {
            minY = 50;
            maxY = 200
        } else {
            minY = 0;
            maxY = 1
        }
        const points = [];
        list.forEach((element, i) => {
            // Coords as a percentage
            let pointX = ((element[graphAxis.x] - minX) * 100) / (maxX - minX);
            let pointY = ((element[graphAxis.y] - minY) * 100) / (maxY - minY);
            let message = getGraphQualities(pointX, graphAxis.x, pointY, graphAxis.y);
            //              No alt text                 Key is assigned as param                        Style defines where the point is                    Update the focus when they are clicked
            points.push(<div key={element[key]} className='point'
                             style={{left: `${pointX}%`, bottom: `${pointY}%`}}
                             onClick={() => updateFocus(parentObj[i], message)}></div>)
        });
        // Return the whole structure, so it can simply
        // be dropped in
        return (
            <>
                <div className='graph-container'>
                    <h1 className='graph-title'>
                        {title}
                        <select className='graph-dropdown' defaultValue={graphAxis.x}
                                onChange={(event) => setGraphAxis({...graphAxis, x: event.target.value})}>
                            {selections.map(function (option) {
                                if (option !== graphAxis.y) {
                                    return <option value={option}>{option}</option>
                                } else {
                                    return <></>
                                }
                            })}
                        </select>
                        vs.
                        <select className='graph-dropdown' defaultValue={graphAxis.y}
                                onChange={(event) => setGraphAxis({...graphAxis, y: event.target.value})}>
                            {selections.map(function (option) {
                                if (option !== graphAxis.x) {
                                    return <option value={option}>{option}</option>
                                } else {
                                    return <></>
                                }
                            })}
                        </select>
                    </h1>
                    <div className='top'>
                        <div className='point-container'>{points}</div>
                        <p className='y-title'>{graphAxis.y}</p>
                    </div>
                    <div className='bottom'>
                        <p className='x-title'>{graphAxis.x}</p>
                    </div>
                </div>
            </>

        )
    }
    // Function that loads the page when necessary
    const loadPage = async () => {
        // If the page hasn't loaded then grab the user data
        if (userID === window.localStorage.getItem("userID")) {
            window.location.hash = "me";
            setUserID("me")
        } else {
            setUserID(window.location.hash.split("#")[1])
        }
        console.log(userID)
        if (!loaded) {
            await retrieveUser(userID).then(function (result) {
                setCurrentUser(result);
                document.title = `Photon | ${result.username}`;
            })
        }
        // Update the datapoint
        await retrieveDatapoint(userID, term).then(async function (result) {
            setDatapoint(result)
            await updateArtistQualities(result);
            await getPlaylists(userID).then(results => {setPlaylists(results); console.log(results)})
            if (!chipletData) {
                setChipletData([result.topArtists[0], result.topGenres[0]])
            }
        })

        // Refresh the focus
        setShowArt("empty")
        setFocusMessage("See what it says.")
        // Indicate that the loading is over
        setLoaded(true);
    }
    // Delay function mainly used for animations
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // The function that updates the focus.
    async function updateFocus(item, tertiaryText) {
        focus.item = item;
        if (!((focus.tertiary === tertiaryText && (focus.title === item.title || focus.title === item.name)) && showArt === true)) {
            setShowArt(false);
            let localState = focus;
            await delay(300);
            localState.image = item.image;
            localState.link = item.link;
            if (item.type === "song") {
                localState.title = item.title;
                localState.secondary = `by ${item.artist}`;
                localState.tertiary = tertiaryText;
            } else if (item.type === "artist") {
                localState.title = item.name;
                localState.secondary = item.genre;
                localState.tertiary = tertiaryText;
            } else {
                localState.title = '';
                localState.secondary = item;
                localState.tertiary = '';
            }
            setFocus(localState);
            await updateFocusMessage(datapoint);
            setShowArt(true)
        }
    }

    useEffect(() => {
        console.warn("useEffect called.")
        loadPage();
    }, [term, userID])

    return (
        <>

            {!loaded ?
                <div className="lds-grid">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                :
                <div className='wrapper'>
                    <div className='user-container'>
                        <img className='profile-picture' alt='Page' src={currentUser.profilePicture}></img>
                        <div style={{display: `flex`, flexDirection: `column`, paddingLeft: `5px`}}>
                            <div className='username'>{currentUser.username}</div>
                            {userID !== "me" ?  <a className={"compare-button"} href={`/compare#${window.localStorage.getItem("userID")}&${currentUser.userID}`}>Compare</a> : <></>}
                            <div style={{
                                display: `flex`,
                                paddingTop: `5px`,
                                gap: `20px`,
                                width: `250px`,
                                flexWrap: `wrap`
                            }}>
                                <ThemeProvider theme={theme}>
                                    <Chip label={`${chipletData[0].name} fan`} style={{borderWidth: `2px`}} variant='outlined'
                                          icon={<PersonIcon fontSize='small' />}
                                          color='primary'/>
                                    <Chip label={`${chipletData[1]} fan`} style={{borderWidth: `2px`}} color='primary' variant='outlined'
                                          icon={<MusicNoteIcon fontSize='small'/>}/>
                                </ThemeProvider>
                            </div>
                        </div>
                        <div className='user-details'>
                            <a href={`https://open.spotify.com/user/${currentUser.userID}`} className='spotify-link'>
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" width="20px" version="1.1"
                                     viewBox="0 0 168 168">
                                    <path fill="#22C55E"
                                          d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"/>
                                </svg>
                                <p>Open profile in Spotify.</p>
                            </a>
                            <p>Followers: PH</p>
                            <p>Playlists: {playlists.length}</p>
                        </div>
                    </div>
                    <div className='media-container'>
                        {currentUser.media ?
                            <>
                                <img className='media-preview' src={currentUser.media.image}
                                     alt={"media preview"}></img>
                                <div className='music-animatic'>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                </div>
                                <p className='listening-media'>{currentUser.media.name}</p>
                            </>
                            :
                            <></>
                        }
                    </div>
                    <div>
                        <div style={{display: `flex`, flexDirection: `row`, justifyContent: `space-evenly`, alignItems: 'center', height: '75px', marginTop: '50px'}}>
                            <img src={arrow} style={{transform: `rotate(180deg) scale(20%)`, cursor: `pointer`}}
                                 onClick={() => decrementSimple()} alt={"arrow"}></img>
                            <h2 className='datapoint-title'>Top {simpleSelection}</h2>
                            <img src={arrow} style={{transform: `scale(20%)`, cursor: `pointer`}}
                                 onClick={() => incrementSimple()} alt={"arrow"}></img>
                        </div>
                        <h2 className='term'>of {term === "long_term" ? "all time" : (term === "medium_term" ? "the last 6 months" : "the last 4 Weeks")}</h2>
                        <div className='term-container'>
                            {terms.map(function(element){
                                return         <button onClick={() => setTerm(element)}
                                               style={term === element ? {backgroundColor: `#22CC5E`, transform: 'scale(95%)', color: 'white', "--fill-color": '#22C55E'} : {
                                                   backgroundColor: `black`,
                                                   cursor: `pointer`,
                                                   width: '100px',
                                                   marginLeft: '-35px',
                                                   marginRight: '-35px',
                                                   color: 'white',
                                                   "--fill-color": 'white'
                                               }}>{element === "long_term" ? "all time" : (element === "medium_term" ? "6 months" : "4 Weeks")}</button>
                            })}
                        </div>
                        <div className='simple-container'>
                            <ol>
                                {datapoint[`top${simpleSelection}`].map(function (element, i) {
                                    if (i < 10) {
                                        const message = i < 3 ? `${userID === "me" ? "Your" : `${currentUser.username}`} ${i > 0 ? (i === 1 ? `2ⁿᵈ to` : `3ʳᵈ to`) : ``} top ${element.type}` : ``;
                                        return <li className='list-item'
                                                   onClick={() => updateFocus(element, message)}>{getLIName(element)}</li>
                                    } else {
                                        return <></>
                                    }
                                })}
                            </ol>
                            <div className='focus-container'>
                                {simpleSelection !== "Genres" ?
                                    <div className='art-container'>
                                        {showArt === "empty" ?
                                            <div className='play-wrapper-empty'>Select an item to view in focus.</div>
                                            :
                                            <a className={showArt ? 'play-wrapper' : 'play-wrapper-hidden'}
                                               href={focus.link} rel="noopener noreferrer" target="_blank">
                                                <img className='art' src={focus.image} alt='Cover art'></img>
                                                <div className='art-text-container'>
                                                    <h1 className={showArt === true ? "art-name-shown" : "art-name-hidden"}>{focus.title}</h1>
                                                    <p className={showArt === true ? "art-desc-shown" : "art-desc-hidden"}
                                                       style={{fontSize: '40px'}}>{focus.secondary}</p>
                                                    <p className={showArt === true ? "art-desc-shown" : "art-desc-hidden"}>{focus.tertiary}</p>
                                                </div>
                                            </a>
                                        }
                                    </div>
                                    :
                                    <div style={{width: `20%`}}></div>
                                }

                                <p className={showArt === true ? "focus-message-shown" : "focus-message-hidden"}>{focusMessage}</p>
                            </div>
                        </div>
                    </div>
                    <Graph title="Your top 50 songs" key="song_id" selections={analyticsMetrics}
                           data={datapoint.topSongs.map(song => song.analytics)} parent={datapoint.topSongs}/>
                    <h2 style={{
                        textTransform: `uppercase`,
                        fontFamily: 'Inter Tight, sans-serif',
                        margin: `auto`,
                        fontSize: `60px`,
                        marginTop: `50px`
                    }}>{currentUser.username}'s playlists</h2>
                    <div className={"playlist-wrapper"}>
                        {playlists.length !== 0 ?
                            playlists.map(function(playlist){
                                return <a href={playlist.external_urls.spotify} className={"playlist-art"}><img alt="playlist art" src={playlist.images[0].url} style={{width: '100%', height: '100%'}}></img>
                                    <div className="playlist-text-container">
                                        <h2 style={playlist.name.length > 20 ? {"--font-scale": `30px`} : {}}>{playlist.name}</h2>
                                        <p>{playlist.description}</p>
                                    </div>

                                </a>
                            })
                            :
                            <></>
                        }
                    </div>

                </div>
            }
        </>
    )
}

export default Page