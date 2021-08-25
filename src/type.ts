export type CourseType = {
  title: string
  description: string
  tag: string
  imageUrl: string
  difficulty: number
  lessons: LessonType[]
}

export type LessonType = {
  title: string
  summary: string
  exp: number
  content: string
  quizContent: string
  quizExplanation: string
  quizCoices: QuizChoice[]
}

export type QuizChoice = {
  content: string
  isCorrect: boolean
}
