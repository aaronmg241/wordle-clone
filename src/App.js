import './App.css';
import { useState, useEffect, useRef } from 'react'
import wordList from './words.txt'
import { calcResultOfGuess, checkStillValidWord, findBestGuess } from './Solver.js'

const keyboard = [
	['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
	['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
	['Ent', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Del']
]

function getRelKey(key) {
	if (key === 'Ent') return 'Enter'
	if (key === 'Del') return 'Backspace'
	return key
}

// Checks if the current guess is the correct word
// Returns true if the guess is correct, false otherwise
function checkGuess(guess, correctWord, row) {

	let transitionDelay = 0
	const results = calcResultOfGuess(guess, correctWord)

	// Adds styles to the squares that were part of the guess
	for (let i = 0; i < guess.length; i++) {

		const squareElement = document.getElementById(row * 5 + i)
		const keyElement = document.getElementById(guess.charAt(i).toUpperCase())

		if (results[i] === 2) {
			squareElement.classList.add("correct")
			keyElement.classList = ("key correct-key")
		} else if (results[i] === 1) {
			squareElement.classList.add("semi-correct")
			if (!keyElement.classList.contains('correct-key')) keyElement.classList.add("semi-correct-key")
		} else {
			squareElement.classList.add("wrong")
			if (!keyElement.classList.contains('correct-key')) keyElement.classList.add("wrong-key")
		}

		squareElement.style.animationDelay = transitionDelay + "s"
		squareElement.style.transitionDelay = transitionDelay + 0.1 + "s"
		transitionDelay += 0.4

	}

	if (results.every(result => result === 2)) {
		return true
	} else {
		return false
	}

}

function App() {

	const [guesses, setGuesses] = useState(Array.from(Array(6), () => new Array(5)))
	const [finishMessage, setFinishMessage] = useState('')
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)

	const position = useRef({ row: 0, col: 0 })
	const guessesRef = useRef(guesses)
	const correctWord = useRef()
	const wordsRef = useRef()
	const finished = useRef(false)
	const validWords = useRef()

	useEffect(() => {

		window.addEventListener('keydown', onKeyPress)

		fetch(wordList).then(r => r.text()).then(text => {
			const wordsArray = text.split(/\r?\n/)

			wordsRef.current = wordsArray
			validWords.current = [...wordsRef.current]
			correctWord.current = wordsRef.current[Math.floor(Math.random() * wordsRef.current.length)]

		})

		return () => window.removeEventListener('keydown', onKeyPress)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {

		if (loading) {

			// This could probably be improved upon. The screen was not rendering in time before the hint was calculated (expensive computation),
			// and the "Loading" message was not working.
			setTimeout(() => { 
				getHint()
				setLoading(false)
			}, 10)

		}

	}, [loading])

	// Gets the best guess from Solver
	function getHint() {

		const bestGuess = findBestGuess(position.current['row'], wordsRef.current, validWords.current)

		setMessage("You should use the word: " + bestGuess)

	}

	// Resets the game to initial state
	function resetBoard() {

		const newGuesses = Array.from(Array(6), () => new Array(5))

		setGuesses(newGuesses)
		guessesRef.current = newGuesses

		position.current =  { row: 0, col: 0 }

		// Get a random word to be the new correct word
		correctWord.current = wordsRef.current[Math.floor(Math.random() * wordsRef.current.length)]
		
		validWords.current = [...wordsRef.current]

		setFinishMessage('')

		// Reset wordle squares
		const squares = document.getElementsByClassName('square')
		for (const square of squares) {
			square.classList = 'square'
			square.style.transitionDelay = '0s'
			square.style.animationDelay = '0s'
		}

		// Reset keyboard
		const keys = document.getElementsByClassName('key')
		for (const key of keys) {
			key.classList = 'key'
		}

		finished.current = false

	}

	// Tries to submit the current guess
	function handleEnterPressed(e, currPosition) {

		e.preventDefault()

		// Checks to make sure word is 5 letters long
		if (currPosition['col'] !== 5) {
			setMessage("Not long enough.")
			document.getElementById("line" + currPosition['row']).classList.add('shake')
			return
		}

		// Create current guess string
		let currGuess = ""
		for (const letter of guessesRef.current[currPosition['row']]) {
			currGuess += letter
		}

		// Check to make sure it is a valid word.
		if (!wordsRef.current.includes(currGuess)) {
			setMessage("Invalid word.")
			document.getElementById("line" + currPosition['row']).classList.add('shake')
			return
		}

		finished.current = checkGuess(currGuess, correctWord.current, currPosition['row'])

		// If end of game reached (result is true or all 6 guesses used), show finish message after animations are done
		if (finished.current) {

			setTimeout(() => setFinishMessage("Good job!"), 2500)

		} else if (currPosition['row'] === 5) {

			setTimeout(() => setFinishMessage("Better luck next time."), 2500)

		}

		const result = calcResultOfGuess(currGuess, correctWord.current)

		// Removes words that are no longer valid
		const newValidWords = []
		for (const word of validWords.current) {
			if (checkStillValidWord(currGuess, result, word)) newValidWords.push(word)
		}
		validWords.current = newValidWords

		position.current = { 'row': Math.min(currPosition['row'] + 1, 6), 'col': 0 }

	}

	// Removes letter from the current guess
	function handleBackspacePressed(e, currPosition) {

		e.preventDefault()

		const newPosition = { 'row': currPosition['row'], 'col': Math.max(currPosition['col'] - 1, 0) }

		const currSquare = document.getElementById(newPosition['row'] * 5 + newPosition['col'])
		currSquare.classList.remove('completed')

		const newGuesses = [...guessesRef.current]
		newGuesses[newPosition['row']][newPosition['col']] = ' '
		setGuesses(newGuesses)
		guessesRef.current = newGuesses

		position.current = newPosition

	}

	function onKeyPress(e) {

		// Don't do anything if game is over
		if (finished.current) return

		const currPosition = position.current

		if (e.key === 'Enter')  handleEnterPressed(e, currPosition)
		else if (e.key === 'Backspace') handleBackspacePressed(e, currPosition)
		else {

			// Key isnt a character
			if (e.key.length > 1 || (!(e.key.charCodeAt(0) >= 97 && e.key.charCodeAt(0) <= 122) && !(e.key.charCodeAt(0) >= 65 && e.key.charCodeAt(0) <= 90))) {
				return
			}

			// Word is already 'full'
			if (currPosition['col'] === 5) {
				return
			}

			const currSquare = document.getElementById(currPosition['row'] * 5 + currPosition['col'])
			currSquare.classList.add('completed')

			const newGuesses = [...guessesRef.current]
			newGuesses[currPosition['row']][currPosition['col']] = e.key.toLowerCase()
			position.current = { 'row': currPosition['row'], 'col': Math.min(currPosition['col'] + 1) }
			
			setGuesses(newGuesses)
			guessesRef.current = newGuesses

		}

	}

	return (
		<div className="App">
		
			<div className="title">
				Wordle Clone
			</div>

			{guesses.map( (guess, i) => {

				return (
					<div className="square-line" key={"line" + i} id={"line" + i} onAnimationEnd={() => document.getElementById("line" + i).classList.remove('shake')}>
						<div className="square"	key={i*5} id={i*5}> {guess[0]} </div>
						<div className="square" key={i*5+1} id={i*5+1}> {guess[1]} </div>
						<div className="square" key={i*5+2} id={i*5+2}> {guess[2]} </div>
						<div className="square" key={i*5+3} id={i*5+3}> {guess[3]} </div>
						<div className="square" key={i*5+4} id={i*5+4}> {guess[4]} </div>
					</div>
				)

			})}

			<button
				className='hint-button'
				onClick={() => {

					if (finished.current || loading) return

					setLoading(true)

				}}
			>
				{loading ? "Loading..." : "Calculate Best Guess"}
			</button>

			<div className='keyboard'>

				{keyboard.map( (line, i) => {

					return (
						<div className='keyboard-line' key={'keyline' + i}>

							{line.map(key => {

								return (
									<button className='key' key={key} id={key} onClick={() => { 
										const e = new KeyboardEvent('keydown', { 'key': getRelKey(key) } ) 
										onKeyPress(e)
									}}>
										{key}
									</button>	
								)

							})}

						</div>	
					)

				})}

			</div>

			{finishMessage.length > 0 && 
				<div className="result-box"> 
					{finishMessage} <br/> <br/>
					<button 
						className="play-again-button"
						onClick={() => {
							resetBoard()
						}}
					> 
						Click here to play again. 
					</button>
				</div>
			}

			{message.length > 0 &&
			
				<div className='message-box' onAnimationEnd={() => { setMessage('') }}>
					{message}
				</div>	
				
			}

		</div>
	);
}

export default App;
