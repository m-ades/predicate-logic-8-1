import { useEffect, useMemo, useState, useLayoutEffect, memo } from 'react'
import {
  Container,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Divider,
  Box,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { QUESTIONS } from './questions.js'

// prevents mathjax content from re-rendering after every new answer
const QuestionText = memo(({ text, id }) => (
  <Typography
    variant="body1"
    component="div"
    dangerouslySetInnerHTML={{ __html: text }}
  />
))

export default function App() {
  const [answers, setAnswers] = useState({})
  const [pop, setPop] = useState(false)

  // startup promise --> DOM paint --> typesets mathjax content
  function runMathJax() {
    const MJ = window.MathJax
    if (!MJ) return
    const ready = MJ.startup?.promise ?? Promise.resolve()
    ready
      .then(() => {
        return new Promise((resolve) => requestAnimationFrame(resolve))
      })
      .then(() => {
        if (typeof MJ.typesetPromise === 'function') {
          return MJ.typesetPromise()
        }
      })
      .catch(() => {
      })
  }
  useEffect(() => {
    runMathJax()
  }, [])

  useLayoutEffect(() => {
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          runMathJax()
        })
      })
    }, 50)
    
    return () => clearTimeout(timeoutId)
  }, [answers])

  const score = useMemo(() => {
    return QUESTIONS.reduce(
      (acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0),
      0
    )
  }, [answers])

  // score change and re-typeset after new answer
  // mathjax runs with same timing as answers useEffect to fix flickering
  useEffect(() => {
    setPop(true)
    const t = setTimeout(() => setPop(false), 250)
    const mathJaxTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          runMathJax()
        })
      })
    }, 50)
    return () => {
      clearTimeout(t)
      clearTimeout(mathJaxTimeout)
    }
  }, [score])

  const scoreStyle = {
    display: 'inline-block',
    transition: 'transform 0.25s ease, filter 0.25s ease',
    transform: pop ? 'scale(1.35)' : 'scale(1)',
    filter: pop ? 'drop-shadow(0 0 6px #88C6F8)' : 'none',
  }

  const handleChange = (qid, val) => {
    setAnswers((prev) => (prev[qid] ? prev : { ...prev, [qid]: val }))
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'background.paper',
          pt: 2,
          pb: 2,
          mb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Chapter 8.1: The Syntax of Predicate Logic & Translation
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          true/false practice set (PHILO/MATH/CSCI 275)
        </Typography>

        <Typography variant="h6">
          Score: <span style={scoreStyle}>{score}</span> / {QUESTIONS.length}
        </Typography>
      </Box>

      <Stack spacing={2} divider={<Divider flexItem />}>
        {QUESTIONS.map((q) => {
          const chosen = answers[q.id]
          const isCorrect = chosen === q.correct

          return (
            <Box key={q.id} sx={{ py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body1"><strong>{q.id}.</strong></Typography>

                <QuestionText text={q.text} id={q.id} />

                {chosen !== undefined && (
                  isCorrect ? (
                    <CheckCircleIcon sx={{ color: '#88C6F8', animation: 'pop 0.25s ease' }} />
                  ) : (
                    <CancelIcon sx={{ color: '#FF7A7A' }} />
                  )
                )}
              </Box>

              <RadioGroup
                row
                value={chosen || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
              >
                {['T', 'F'].map((val) => (
                  <FormControlLabel
                    key={val}
                    value={val}
                    label={val === 'T' ? 'True' : 'False'}
                    control={
                      <Radio
                        disabled={Boolean(chosen)}
                        sx={{
                          color: 'action.active',
                          '&.Mui-checked': { color: '#88C6F8' },
                          '&.Mui-checked:hover': { transform: 'scale(1.1)' },
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    }
                  />
                ))}
              </RadioGroup>
            </Box>
          )
        })}
      </Stack>

      <style>
        {`
          @keyframes pop {
            0% { transform: scale(0.7); }
            100% { transform: scale(1); }
          }
          mjx-container {
            font-family: "IBM Plex Mono", monospace !important;
            font-size: 1.03em;
          }
        `}
      </style>
    </Container>
  )
}
