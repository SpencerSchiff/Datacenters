import { useState } from 'react'

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  points: number
}

interface Round {
  name: string
  questions: Question[]
}

const triviaData: Round[] = [
  {
    name: "Easy Round",
    questions: [
      {
        id: 1,
        question: "What is the name of Luke Skywalker's home planet?",
        options: ["Alderaan", "Tatooine", "Hoth", "Naboo"],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 2,
        question: "Who is revealed to be Luke's father?",
        options: ["Obi-Wan Kenobi", "Emperor Palpatine", "Darth Vader", "Mace Windu"],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 3,
        question: "What weapon does a Jedi use?",
        options: ["Blaster", "Lightsaber", "Sword", "Staff"],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 4,
        question: "What is the name of Han Solo's ship?",
        options: ["X-wing", "TIE Fighter", "Millennium Falcon", "Star Destroyer"],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 5,
        question: "Who rescues Princess Leia from the Death Star?",
        options: ["Luke, Han, and Chewbacca", "Obi-Wan alone", "R2-D2 and C-3PO", "Rebel pilots"],
        correctAnswer: 0,
        points: 10
      },
      {
        id: 6,
        question: "What does Yoda lift using the Force on Dagobah?",
        options: ["Rocks", "Luke's X-wing", "R2-D2", "His walking stick"],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 7,
        question: "Who killed Jango Fett?",
        options: ["Anakin Skywalker", "Obi-Wan Kenobi", "Mace Windu", "Yoda"],
        correctAnswer: 2,
        points: 10
      },
      {
        id: 8,
        question: "What is the name of the young queen of Naboo?",
        options: ["Leia", "Padmé", "Shmi", "Mon Mothma"],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 9,
        question: "How many suns does Tatooine have?",
        options: ["One", "Two", "Three", "Four"],
        correctAnswer: 1,
        points: 10
      },
      {
        id: 10,
        question: "How many forms of communication is C-3PO fluent in?",
        options: ["Over 1 million", "Over 6 million", "Over 3 million", "Over 10 million"],
        correctAnswer: 1,
        points: 10
      }
    ]
  },
  {
    name: "Medium Round",
    questions: [
      {
        id: 11,
        question: "What is the name of the senator who becomes Emperor?",
        options: ["Bail Organa", "Palpatine", "Jar Jar Binks", "Padmé Amidala"],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 12,
        question: "Who trained Obi-Wan Kenobi?",
        options: ["Yoda", "Mace Windu", "Qui-Gon Jinn", "Count Dooku"],
        correctAnswer: 2,
        points: 20
      },
      {
        id: 13,
        question: "What bounty hunter captures Han Solo in carbonite?",
        options: ["Jango Fett", "Boba Fett", "Dengar", "IG-88"],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 14,
        question: "What do Ewoks live in?",
        options: ["Caves", "Underground", "Tree houses", "Space ships"],
        correctAnswer: 2,
        points: 20
      },
      {
        id: 15,
        question: "What is the name of the ice planet where the Rebels have a base?",
        options: ["Dagobah", "Endor", "Hoth", "Kamino"],
        correctAnswer: 2,
        points: 20
      },
      {
        id: 16,
        question: "What planet do Luke and Obi-Wan travel to rescue Princess Leia?",
        options: ["Yavin 4", "Death Star", "Alderaan", "Mos Eisley"],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 17,
        question: "Who destroys the second Death Star?",
        options: ["Luke Skywalker", "Lando Calrissian", "Wedge Antilles", "Han Solo"],
        correctAnswer: 1,
        points: 20
      },
      {
        id: 18,
        question: "Who cuts off Anakin's legs on Mustafar?",
        options: ["Yoda", "Mace Windu", "Obi-Wan Kenobi", "Emperor Palpatine"],
        correctAnswer: 2,
        points: 20
      },
      {
        id: 19,
        question: "What happens to Boba Fett during the sail barge battle?",
        options: ["He escapes", "Luke kills him", "He falls into the pit", "Han shoots him"],
        correctAnswer: 2,
        points: 20
      },
      {
        id: 20,
        question: "What does C-3PO say about the odds of successfully navigating an asteroid field?",
        options: ["1,000 to 1", "3,720 to 1", "5,000 to 1", "10,000 to 1"],
        correctAnswer: 1,
        points: 20
      }
    ]
  },
  {
    name: "Hard Round",
    questions: [
      {
        id: 21,
        question: "According to the Rebel briefing, how wide is the Death Star's exhaust port?",
        options: ["1 meter", "2 meters", "3 meters", "5 meters"],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 22,
        question: "Complete Obi-Wan's line: 'These aren't the droids...'",
        options: ["you want", "you're looking for", "we're looking for", "you need"],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 23,
        question: "What does Vader say to Luke when he cuts off his hand?",
        options: ["Join me, and together we can rule the galaxy", "Luke, I am your father", "No, I am your father", "The Force is strong with you"],
        correctAnswer: 2,
        points: 30
      },
      {
        id: 24,
        question: "What does Obi-Wan tell Luke about his father's death?",
        options: ["He was betrayed by a young Jedi", "A young Jedi named Darth Vader betrayed and murdered him", "He died in the Clone Wars", "He was killed by the Emperor"],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 25,
        question: "What does Watto say about humans and podracing?",
        options: ["They're too slow", "No human can do it", "It's impossible", "They always crash"],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 26,
        question: "What does Han Solo say right before entering hyperspace to escape Hoth?",
        options: ["Here we go!", "Punch it!", "Never tell me the odds!", "Hold on!"],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 27,
        question: "Who said 'I have a bad feeling about this' first in Episode IV?",
        options: ["Han Solo", "Luke Skywalker", "Princess Leia", "C-3PO"],
        correctAnswer: 1,
        points: 30
      },
      {
        id: 28,
        question: "What is the call sign of the Rebel pilot who destroys the Death Star?",
        options: ["Red Five", "Red Leader", "Gold Leader", "Red Two"],
        correctAnswer: 0,
        points: 30
      },
      {
        id: 29,
        question: "Who said 'So this is how liberty dies, with thunderous applause'?",
        options: ["Bail Organa", "Mon Mothma", "Padmé Amidala", "Obi-Wan Kenobi"],
        correctAnswer: 2,
        points: 30
      },
      {
        id: 30,
        question: "Complete Obi-Wan's instruction to Luke: 'Use the Force, Luke. Let go...'",
        options: ["trust your feelings", "your instincts", "let go your conscious self", "trust in the Force"],
        correctAnswer: 2,
        points: 30
      }
    ]
  }
]

export default function StarWarsTrivia() {
  const [currentRound, setCurrentRound] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [gameComplete, setGameComplete] = useState(false)

  const currentQuestionData = triviaData[currentRound]?.questions[currentQuestion]

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return

    let newScore = score
    if (selectedAnswer === currentQuestionData.correctAnswer) {
      newScore = score + currentQuestionData.points
      setScore(newScore)
    }

    setShowResult(true)
    
    setTimeout(() => {
      setShowResult(false)
      setSelectedAnswer(null)

      if (currentQuestion < 9) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        const roundScore = newScore - roundScores.reduce((sum, s) => sum + s, 0)
        setRoundScores([...roundScores, roundScore])
        
        if (currentRound < 2) {
          setCurrentRound(currentRound + 1)
          setCurrentQuestion(0)
        } else {
          setGameComplete(true)
        }
      }
    }, 2000)
  }

  const resetGame = () => {
    setCurrentRound(0)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setScore(0)
    setShowResult(false)
    setRoundScores([])
    setGameComplete(false)
  }

  if (gameComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title text-3xl justify-center mb-4">Game Complete!</h2>
            <div className="space-y-4">
              <div className="text-2xl font-bold">Final Score: {score} points</div>
              <div className="space-y-2">
                <div>Easy Round: {roundScores[0] || 0} points</div>
                <div>Medium Round: {roundScores[1] || 0} points</div>
                <div>Hard Round: {roundScores[2] || 0} points</div>
              </div>
              <div className="text-lg">
                {score >= 500 ? "Jedi Master! Perfect score!" :
                 score >= 400 ? "Jedi Knight! Excellent knowledge!" :
                 score >= 300 ? "Padawan! Good effort!" :
                 "Youngling! May the Force be with you!"}
              </div>
              <button className="btn btn-primary" onClick={resetGame}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-2xl">{triviaData[currentRound].name}</h2>
            <div className="text-right">
              <div className="text-sm">Score: {score}</div>
              <div className="text-xs">Question {currentQuestion + 1}/10</div>
            </div>
          </div>

          <div className="progress progress-primary w-full mb-6">
            <div 
              className="progress-bar" 
              style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
            ></div>
          </div>

          {showResult ? (
            <div className="text-center">
              <div className={`text-2xl font-bold mb-4 ${
                selectedAnswer === currentQuestionData.correctAnswer ? 'text-success' : 'text-error'
              }`}>
                {selectedAnswer === currentQuestionData.correctAnswer ? 'Correct!' : 'Incorrect!'}
              </div>
              {selectedAnswer !== currentQuestionData.correctAnswer && (
                <div className="text-lg mb-4">
                  The correct answer was: {currentQuestionData.options[currentQuestionData.correctAnswer]}
                </div>
              )}
              <div className="text-lg">
                {selectedAnswer === currentQuestionData.correctAnswer 
                  ? `+${currentQuestionData.points} points!` 
                  : '+0 points'}
              </div>
            </div>
          ) : (
            <>
              <div className="text-lg font-semibold mb-6">
                {currentQuestionData.question}
              </div>

              <div className="space-y-3">
                {currentQuestionData.options.map((option, index) => (
                  <button
                    key={index}
                    className={`btn btn-outline w-full text-left justify-start ${
                      selectedAnswer === index ? 'btn-primary' : ''
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>

              <div className="card-actions justify-end mt-6">
                <button
                  className="btn btn-primary"
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                >
                  {currentQuestion === 9 ? 
                    (currentRound === 2 ? 'Finish Game' : 'Next Round') : 
                    'Next Question'
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}