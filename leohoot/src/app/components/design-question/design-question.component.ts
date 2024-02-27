import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Question} from 'src/app/model/question';
import {ConfigurationService} from 'src/app/services/configuration.service';
import {RestService} from 'src/app/services/rest.service';
import {SignalRService} from 'src/app/services/signalr.service';

@Component({
  selector: 'app-design-question',
  templateUrl: './design-question.component.html'
})

export class DesignQuestionComponent {
  existingQuestions: Question[] = [];

  question: Question = {
    questionText: 'New Question',
    answerTimeInSeconds: 0,
    previewTime: 0,
    answers: [],
    id: 0,
    questionNumber: 0,
    nextQuestionId: null,
    imageName: undefined
  };

  editMode: boolean = false;

  quizTitle: string = '';

  constructor(private restService: RestService, private router: Router, private route: ActivatedRoute, private signalRService: SignalRService, private configurationService: ConfigurationService) {
  }

  ngOnInit() {
    this.refetchQuestions()

    this.route.queryParams.subscribe(params => {
      if (typeof params['quizName'] !== 'undefined') {
        this.quizTitle = params['quizName'];
      }

      if (typeof params['questionNumber'] !== 'undefined') {
        this.displayQuestion(Number.parseInt(params['questionNumber']));
      } else {
        this.initNewQuestion();
      }
    });
  }

  initNewQuestion() {
    this.question = {
      questionText: '',
      answerTimeInSeconds: 15,
      previewTime: 5,
      answers: [],
      id: -1,
      questionNumber: 0,
      nextQuestionId: null,
      imageName: undefined
    };

    for (let i = 0; i < 4; i++) {
      this.question.answers.push({answerText: '', isCorrect: false});
    }

    this.editMode = false;
  }

  refetchQuestions() {
    this.existingQuestions = this.configurationService.getQuestions();
  }

  validateQuestion() {
    if (this.question.questionText === undefined || this.question.questionText === '' || this.question.answers[0].answerText === undefined || this.question.answers[0].answerText === '' || this.question.answers[1].answerText === undefined || this.question.answers[1].answerText === '') {
      return false;
    }
    return true;
  }

  onQuestionAdd() {
    const isQuestionValid = this.validateQuestion();

    if (!isQuestionValid) {
      alert('Please fill in all necessary fields to save the question.');
      return;
    }

    if (this.doesQuestionExist() && !this.editMode) { 
      alert('This question already exists.');
      return;
    }

    if (this.editMode) {
      this.initNewQuestion();
      this.refetchQuestions();
      return;
    }

    this.configurationService.addQuestion(this.question);
    this.initNewQuestion();
    this.refetchQuestions();
  }

  onQuestionDelete(id: number) {
    this.configurationService.deleteQuestion(id);
    this.refetchQuestions();    
  }

  onQuestionEdit(questionNumber: number) {
    if (this.question.questionNumber !== questionNumber) {
      alert('Please save the current question before editing another one.');
      return;
    }

    const questionIsValid = this.validateQuestion();

    if (questionIsValid) {
      this.configurationService.updateQuestion(this.question);
    } else {
      alert('Please fill in all necessary fields to save the question.');
    }

    this.refetchQuestions();
    console.log(this.existingQuestions);
  }

  onQuizTitle() {
    if (this.question.questionText === undefined || this.question.questionText === '' && this.question.answers[0].answerText === undefined || this.question.answers[0].answerText === '' && this.question.answers[1].answerText === undefined || this.question.answers[1].answerText === '' 
        || this.validateQuestion()) {
      this.router.navigate(['/quizMaker'], {queryParams: {quizName: this.quizTitle}});
    } else if (this.validateQuestion() === false) {
      alert('Please fill in all necessary fields to save the question first.');
    }
  }

  doesQuestionExist() {
    return this.existingQuestions.some(existingQuestion => 
      existingQuestion.questionText === this.question.questionText &&
      existingQuestion.answerTimeInSeconds === this.question.answerTimeInSeconds &&
      existingQuestion.previewTime === this.question.previewTime &&
      JSON.stringify(existingQuestion.answers) === JSON.stringify(this.question.answers) &&
      existingQuestion.imageName === this.question.imageName
    );
  }

  handleFileInput(event: any) {
    const files = event?.target?.files;
    if (files && files.length > 0) {
      const file = files.item(0);
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.question.imageName = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file.')
      }
    } else {
      alert('Please select an image file.')
    }
  }

  displayQuestion(data: number | Question) {
    if (typeof data === 'number') {
      this.refetchQuestions()

      const searchResult = this.existingQuestions.find(question => question.questionNumber === data);
      if (!searchResult) {
        alert('Question not found');
        return
      }
      this.question = searchResult;
    } else {
      this.question = data as Question;
    }
    this.editMode = true;
  }

  truncateText(text: string | undefined, maxLength: number): string {
    return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';
  }

  decrement(type: "answerTime" | "previewTime") {
    if (type === 'answerTime' && this.question.answerTimeInSeconds > 5) {
      this.question.answerTimeInSeconds--;
    } else if (type === 'previewTime' && this.question.previewTime > 3) {
      this.question.previewTime--;
    }
  }

  increment(type: "answerTime" | "previewTime") {
    if (type === 'answerTime') {
      this.question.answerTimeInSeconds++;
    } else if (type === 'previewTime') {
      this.question.previewTime++;
    }
  }
}
