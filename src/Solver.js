export function calcResultOfGuess(guess, correctWord) {

	let correctCopy = correctWord.slice()

	// Stores if each letter at its respective index is correct (2), semi-correct (1), or incorrect (0) so we can style the squares later
	const result = new Array(5).fill(0)

	// First, check for correct letters. If a correct letter is found, we remove it from the string so it cannot be found later
	// when checking for 'semi-correct' letters
	for (let i = 0; i < correctCopy.length; i++) {

		if (guess.charAt(i) === correctCopy.charAt(i)) {

			correctCopy = correctCopy.substring(0, i) + " " + correctCopy.substring(i + 1, 5) // Remove letter from string
			result[i] = 2

		}

	}

	// Checks for semi-correct or incorrect letters
	for (let i = 0; i < correctCopy.length; i++) {

		if (result[i] === 2) continue

		if (correctCopy.includes(guess.charAt(i))) {
	
			const letterIndex = correctCopy.indexOf(guess.charAt(i))
			result[i] = 1
			correctCopy = correctCopy.substring(0, letterIndex) + " " + correctCopy.substring(letterIndex + 1, 5)

		}

	}
	
	return result

}

export function checkStillValidWord(guess, result, word) {

	let wordCopy = word.slice()

	// Checking for green squares
	// Must remove them first, otherwise a letter earlier in the string could mistakenly appear yellow
	for (let i = 0; i < result.length; i++) {

		if (result[i] === 2) {

			if (wordCopy[i] !== guess[i]) return false // Case where letters are supposed to be the same but they arent
			else wordCopy = wordCopy.substring(0, i) + " " + wordCopy.substring(i + 1, 5)
			
		} else {
			if (wordCopy[i] === guess[i]) return false // Case where the letters are the same but the correct word doesnt have that letter in this spot
		}

	}

    for (let i = 0; i < result.length; i++) {

        if (result[i] === 1) {

			if (wordCopy.includes(guess[i])) {

				const letterIndex = wordCopy.indexOf(guess[i])
				wordCopy = wordCopy.substring(0, letterIndex) + " " + wordCopy.substring(letterIndex + 1, 5)

			} else return false // Case where the letter is yellow in the guess but the word doesn't have the letter in it

		}

		if (result[i] === 0 && wordCopy.includes(guess[i])) return false // Case where letter is grey in our guess but is in the word we are checking

    }

	return true

}

export function testIfWordValid() {

	console.log("### TESTS ###")
	console.log("Expect true, received: " + checkStillValidWord("those", [1, 1, 1, 0, 1], "other"))
	console.log("Expect true, received: " + checkStillValidWord("aulic", [0, 0, 0, 0, 0], "other"))
	console.log("Expect true, received: " + checkStillValidWord("those", [1, 0, 0, 0, 1], "fetal"))
	console.log("Expect true, received: " + checkStillValidWord("those", [0, 0, 0, 0, 0], "drunk"))
	console.log("Expect true, received: " + checkStillValidWord("those", [0, 0, 0, 1, 0], "nasal"))
	console.log("Expect true, received: " + checkStillValidWord("those", [0, 0, 0, 2, 1], "cress"))
	console.log("Expect true, received: " + checkStillValidWord("apsis", [2, 0, 1, 0, 2], "abyss"))
	console.log("Expect true, received: " + checkStillValidWord("tasks", [2, 0, 0, 0, 2], "thots"))
	console.log("Expect true, received: " + checkStillValidWord("tasks", [2, 0, 2, 2, 2], "tusks"))
	console.log("Expect false, received: " + checkStillValidWord("tasks", [2, 0, 2, 2, 1], "tusks"))
	console.log("Expect false, received: " + checkStillValidWord("tasks", [2, 0, 1, 0, 1], "tusks"))
	console.log("Expect false, received: " + checkStillValidWord("tasks", [2, 0, 1, 0, 0], "tusks"))
	console.log("Expect false, received: " + checkStillValidWord("those", [1, 1, 1, 0, 2], "other"))
	console.log("### END TESTS ###")

}

export function calculatePossibleOutcomes(guess, validWords) {

	const resultFreqs = {}

	// Use each word as the 'correct word'
    for (let i = 0; i < validWords.length; i++) {

        const result = calcResultOfGuess(guess, validWords[i])
		const resultString = JSON.stringify(result)
		resultFreqs[resultString] = resultFreqs[resultString] ? resultFreqs[resultString] + 1 : 1

    }

	return resultFreqs

}

export function calcEntropy(guess, validWords) {

	const resultFreqs = calculatePossibleOutcomes(guess, validWords)
	let entropy = 0

	for (const resultString in resultFreqs) {

		let count = 0
		const result = JSON.parse(resultString)

		for (let i = 0; i < validWords.length; i++) {
			if (checkStillValidWord(guess, result, validWords[i])) count++
		}

		// log2(1/p) where p is how much the validWords list is cut down by. For example, if after the guess, only 1/4 of the words of validWords are still valid,
		// then p is 1/4
		const informationGained = Math.log2( 1 / ( count / validWords.length ) )

		// 238 is number of possible patterns... 3^5 - 5 where 5 comes from 5 possible patterns of 4 green and 1 yellow
		entropy += (resultFreqs[resultString] / 238) * informationGained

	}

	return entropy

}

// Calculates which guess provides the highest entropy, or probability of giving most information
export function findBestGuess(currRow, allWords, validWords) {

	if (currRow === 0) {
		return "raise"
	}

	let maxEntropy = 0
	let maxWord = validWords[0]

	for (const word of allWords) {

		const currEntropy = calcEntropy(word, validWords)

		if (currEntropy > maxEntropy) {
			maxEntropy = currEntropy
			maxWord = word
		}

	}

	return maxWord

}