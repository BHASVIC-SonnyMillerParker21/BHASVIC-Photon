import {ClickAwayListener, FormControl, TextField} from "@mui/material";
import React, {useEffect, useState} from "react";
import {styled} from "@mui/material/styles";
import "./../CSS/TopBar.css";
import "./../CSS/Search.css"
import {getAllUsers} from "./API";

const SearchBar = styled(TextField)({
    "& .MuiInputBase-root": {
        color: 'white'
    },
    '& .MuiInput-underline': {
        color: `white`,
    },
    '& .MuiFormLabel-root.Mui-disabled': {
        color: `white`,
    },
    '& .MuiInput-underline:after': {
        borderBottomColor: '#22C55E',
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'white',
            borderRadius: `0px`,
            borderWidth: '2px',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            borderColor: 'white',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#22C55E',
            borderRadius: `5px`,
            transition: `all 0.1s ease-in`
        },
    },
    '& label.Mui-focused': {
        color: 'white',
        fontFamily: 'Inter Tight, sans-serif',
    },
    '& .MuiFormLabel-root': {
        color: 'white',
        marginLeft: `5px`,
        fontFamily: 'Inter Tight, sans-serif',
    },
});

export const Search = () => {
    const [searchResults, setSearchResults] = useState(null)
    const [cachedUsers, setCachedUsers] = useState(null)


    const Levenshtein = (a, b) => {
        // First two conditions
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const arr = [];
        // Populate array with b
        for (let i = 0; i <= b.length; i++) {
            arr[i] = [i];
            // Populate array with a and compare
            for (let j = 1; j <= a.length; j++) {
                arr[i][j] =
                    i === 0 ?
                        j
                        :
                        Math.min(
                            arr[i - 1][j] + 1,
                            arr[i][j - 1] + 1,
                            arr[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
                        );
            }
        }
        // Return the result
        return arr[b.length][a.length];
    }

    const handleClickAway = () => {
        setSearchResults(null);
    }

    const handleChange = (event) => {
        // What the user has typed in so far.
        let searchParam = event.target.value;
        const usernames = cachedUsers.map(user => user.username);
        let results = [];
        // Don't check if the user has only typed in a couple of characters
        if (searchParam.length > 2) {
            usernames.forEach(username => {
                let weight = Levenshtein(searchParam, username)
                if (weight < 10) {
                    results.push({username: username, weight: weight})
                }
            })
            // Order results by their relevance.
            results.sort((a, b) => a.weight - b.weight)
            // Match each username to their user record in the DB
            results.forEach((user, i) => {
                results[i] = cachedUsers[cachedUsers.findIndex(object => {
                    return object.username === user.username
                })]
            })
            setSearchResults(results);
        } else {
            setSearchResults(null)
        }
    }

    const updateCachedUsers = () => {
        getAllUsers().then(function (result) {
            setCachedUsers(result);
        })
    }
    useEffect(() => {
        updateCachedUsers();
    }, [])

    return (
        <div className='search-bar-container'>
            <ClickAwayListener onClickAway={handleClickAway}>
                <FormControl variant="outlined">
                    <SearchBar className='search-bar' inputProps={{className: `search-label`}}
                               onChange={handleChange} label="Search"></SearchBar>
                </FormControl>
            </ClickAwayListener>
            {searchResults !== null ?
                <div id="result" style={{top: '140px'}}>
                    {searchResults.map(function (user) {
                        return <a href={`profile#${user.user_id}`}><img
                            alt={"profile picture"}
                            src={user.picture_url}></img>{user.username.length > 14 ? user.username.slice(0, 14) + "..." : user.username}
                        </a>
                    })
                    }</div>
                :
                <></>
            }

        </div>
    )
}

export default Search;