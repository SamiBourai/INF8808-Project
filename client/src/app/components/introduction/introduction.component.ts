import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  Renderer2,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.css']
})
export class IntroductionComponent implements OnInit, AfterViewInit {
  
  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
  }



  
  ngOnDestroy() {
  }

}
