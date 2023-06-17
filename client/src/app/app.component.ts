import { Component, OnInit } from '@angular/core';
import * as aos from 'aos';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    };
    // aos.init();
  }
}
