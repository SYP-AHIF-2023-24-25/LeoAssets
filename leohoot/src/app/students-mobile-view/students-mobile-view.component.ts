import {Component, Input} from '@angular/core';
import * as signalR from "@microsoft/signalr";
import {Question} from "../../model/question";
import {ActivatedRoute, Router} from "@angular/router";
import {RestService} from "../services/rest.service";
import {Answer} from "../../model/answer";

@Component({
  selector: 'app-students-mobile-view',
  templateUrl: './students-mobile-view.component.html',
  styleUrls: ['./students-mobile-view.component.css']
})
export class StudentsMobileViewComponent {
  connection!: signalR.HubConnection;
  questionIsFinished: boolean = false;
  @Input() currentQuestionId: number = 1;
  @Input() mode: number = 0;
  quizLength = this.restservice.getQuizLength();
  currentQuestion: Question = this.restservice.getQuestionById(1)!;
  colors = [
    'bg-button-yellow',
    'bg-red-500',
    'bg-green-400',
    'bg-button-blue',
  ];

  icons = [
    'assets/images/cat.png',
    'assets/images/crab.png',
    'assets/images/frog.png',
    'assets/images/bird.png'
  ]
  pickedAnswer: Answer[] = [];

  constructor(private router: Router, private route: ActivatedRoute, private restservice: RestService) {
  }

  ngOnInit() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5134/hub")
      .build();

    this.connection.start()
      .then(() => {
        console.log('Connection started!');
        this.connection.send("sendMessage", "Hello")
      } )
      .catch(err => console.log('Error while establishing connection :('));

    this.connection.on("questionIsFinished", () => {
      this.questionIsFinished = true;
    });

    this.route.queryParams.subscribe(params => {
      if (typeof params['currentQuestionId'] !== 'undefined') {
        this.currentQuestionId = params['currentQuestionId'];
      }
      if (typeof params['mode'] !== 'undefined') {
        this.mode = params['mode'];
      }
      const response: Question | undefined = this.restservice.getQuestionById(this.currentQuestionId);
      if (typeof response === 'undefined') {
        this.router.navigate(['/studentMobileView']);
      } else {
        this.currentQuestion = response;
      }
    });
  }

  answerQuestion(answer: string) {
    this.connection.send("answerQuestion", answer);
    this.questionIsFinished = true;
  }

  showCorrectAnswer() {
    this.connection.send("showCorrectAnswer");
  }

  addToAnswer(answer: Answer) {
    this.pickedAnswer.push(answer);
  }

  nextQuestion() {
    this.connection.send("nextQuestion");
    this.questionIsFinished = false;
    this.pickedAnswer = [];
    this.router.navigate(['/studentMobileRanking'], {queryParams: {currentQuestionId: this.currentQuestionId, mode: this.mode}});
    //window.location.href = '/studentMobileView?currentQuestionId=' + (this.currentQuestionId) + '&mode=' + this.mode;
  }

  viewRanking() {
    //this.connection.send("viewRanking");
    //window.location.href = '/ranking?currentQuestionId=' + (this.currentQuestionId) + '&mode=' + this.mode;
  }
}
