import { Component, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Player } from 'src/app/model/player';
import { Question } from 'src/app/model/question';
import { Quiz } from 'src/app/model/quiz';
import { Statistic } from 'src/app/model/statistic';
import { RestService } from 'src/app/services/rest.service';
import { SignalRService } from 'src/app/services/signalr.service';
import { ApexFill, ApexTheme, ChartComponent } from "ng-apexcharts";

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  colors: any;
  labels: any;
};

@Component({
  selector: 'app-end-statistics',
  templateUrl: './end-statistics.component.html',
  styleUrls: []
})
export class EndStatisticsComponent {
  displayStatistics: boolean = false;
  questions: Question[] = [];
  questionAnswers!: { [key: number]: boolean[] };
  resultInPercentage!: string;
  correctAnswers!: number;
  totalAnswers!: number;
  quizTitle!: string;
  topThreePlayers: Player[] = [];

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;

  

  constructor(private router: Router, private route: ActivatedRoute, private restservice: RestService, private signalRService: SignalRService) {
    this.correctAnswers = 50;
    this.totalAnswers = 50;
    this.chartOptions = {
      series: [this.correctAnswers, this.totalAnswers],
      chart: {
        type: "donut"
      },
      colors: ["#8AE67C", "#FF6F61",],
      labels: ["correct", "incorrect"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
  }
  
  ngOnInit(): void {
    //quizId = ??
    this.restservice.getQuizById(1).subscribe((data) => {
      this.quizTitle = data.title;
    });

    this.restservice.getGameStatistics(1).subscribe((data) => {
      this.questions = data.questions;
      this.questionAnswers = data.questionAnswers;
    });

    this.restservice.getRanking(1, this.questions.length).subscribe((data) => {
      if (data === undefined) {
        this.topThreePlayers = [ {username: "No players yet", score: 0} ];
      } else {
        if (data.length > 3) {
          this.topThreePlayers = data.slice(0, 3);
        } else {
          while (data.length < 3) {
            data.push({ username: "", score: 0 });
          }
          
          this.topThreePlayers = data;
        }
      }      
    });
  }

  showStatistics() {
    this.displayStatistics = !this.displayStatistics;
  }

  calculateResults(questionNumber: number) {
    if (!this.questionAnswers[questionNumber]) {
       this.resultInPercentage = "0 %";
       this.correctAnswers = 0;
        this.totalAnswers = 0;
    } else {
      this.correctAnswers = this.questionAnswers[questionNumber].filter((answer) => answer === true).length;
      this.totalAnswers = this.questionAnswers[questionNumber].length;

      if (this.totalAnswers > 0) {
        this.resultInPercentage = (this.correctAnswers / this.totalAnswers * 100).toFixed(2) + " %";
      } else {
        this.resultInPercentage = "0 %";
      }
    }
  }

  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
