import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RestService} from "../../services/rest.service";
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-students-mobile-view',
  templateUrl: './students-mobile-view.component.html',
  styleUrls: []
})
export class StudentsMobileViewComponent {
  username: string = sessionStorage.getItem("username") || "test";
  questionIsFinished: boolean = false;
  quizLength = this.restservice.getQuizLength();
  currentQuestionId: number = 1;
  currentQuestionCount: number = 0;
  buttons: boolean[] = [false, false, false, false];
  colors = [
    'bg-button-yellow',
    'bg-green-400',
    'bg-rose-400',
    'bg-blue-400',
  ];

  icons = [
    'assets/images/cat.png',
    'assets/images/frog.png',
    'assets/images/crab.png',
    'assets/images/bird.png'
  ]
  points: number = 0;

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
      this.getAnswerCountOfQuestion();
    });

    this.signalRService.connection.send("sendPoints", this.username);
    this.signalRService.connection.on("pointsReceived", (points: number, currentPoints: number) => {
      this.points = points;
    });
  }

  getAnswerCountOfQuestion() {
    const response: number | undefined = this.restservice.getAnswerCountOfQuestion(this.currentQuestionId);
    if (typeof response === 'undefined') {
      this.router.navigate(['/studentMobileRanking'], { queryParams: { currentQuestionId: this.currentQuestionId } });
    } else {
      this.currentQuestionCount = response;
      this.generateButtons();
    }
  }

  generateButtons() {
    this.buttons = [];
    for (let i = 0; i < this.currentQuestionCount; i++) {
      this.buttons.push(false);
    }
  }

  addToAnswer(indexOfAnswer: number) {
    this.buttons[indexOfAnswer] = !this.buttons[indexOfAnswer];
  }

  confirmAnswers() {
    const areAnswersCorrect: boolean = this.restservice.areAnswersCorrect(this.currentQuestionId, this.buttons);
    if (areAnswersCorrect) {
      this.signalRService.connection.send("confirmAnswer", this.username);
    }
    this.router.navigate(['/studentLoadingScreen'], { queryParams: { currentQuestionId: this.currentQuestionId } });
  }
}
