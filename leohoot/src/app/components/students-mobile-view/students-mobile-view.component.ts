import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RestService} from "../../services/rest.service";
import { SignalRService } from '../../services/signalr.service';
import { Question } from 'src/app/model/question';

@Component({
  selector: 'app-students-mobile-view',
  templateUrl: './students-mobile-view.component.html',
  styleUrls: []
})
export class StudentsMobileViewComponent {
  username: string = sessionStorage.getItem("username") || "test";
  questionIsFinished: boolean = false;
  quizLength: number = 0;
  currentQuestionId: number = 1;
  question: Question | undefined;
  currentPoints: number = 0;
  buttons: boolean[] = [false, false, false, false];
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

  constructor(private router: Router, private route: ActivatedRoute, private restservice: RestService, private signalRService: SignalRService) {
  }

  ngOnInit() {
    this.getParams();
    this.signalRService.connection.on("endLoading", () => {
      this.router.navigate(['/studentMobileRanking'], { queryParams: { currentQuestionId: this.currentQuestionId } });
    });
  }

  getParams() {
    this.route.queryParams.subscribe(params => {
      if (typeof params['currentQuestionId'] !== 'undefined') {
        this.currentQuestionId = parseInt(params['currentQuestionId']);
      }
      this.getInformationAboutQuestion();
    });
  }

  getInformationAboutQuestion() {
    this.restservice.getQuestionByQuestionNumber(this.currentQuestionId, this.username).subscribe((data) => {
      this.question = data.question;
      this.currentPoints = data.points;
      this.quizLength = data.quizLength;
      this.generateButtons();
    });
  }

  generateButtons() {
    this.buttons = [];
    for (let i = 0; i < this.question!.answerCount!; i++) {
      this.buttons.push(false);
    }
  }

  addToAnswer(indexOfAnswer: number) {
    this.buttons[indexOfAnswer] = !this.buttons[indexOfAnswer];
  }

  confirmAnswers() {
    this.restservice.areAnswersCorrect(this.currentQuestionId, this.buttons).subscribe((response) => {
      if (response) {
        this.signalRService.connection.send("confirmAnswer", this.username);
      }
      this.router.navigate(['/studentLoadingScreen'], { queryParams: { currentQuestionId: this.currentQuestionId } });
    });
  }
}
