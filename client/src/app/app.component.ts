import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import * as aos from 'aos';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('navDots') navDots!: ElementRef;
  @ViewChildren('section') sectionElements!: QueryList<ElementRef>;


    // Initialize sections as an array of objects, each with an id and a name.
    sections : { id: string; name: string }[] = [
      { id: 'section0', name: 'Introduction' },
      { id: 'section1', name: 'Teams' },
      { id: 'section2', name: 'Results'},
      { id: 'section3', name: 'Goals' },
      { id: 'section4', name: 'Activity' },
      { id: 'section5', name: 'Efficiency' },
      { id: 'section6', name: 'Possessions' },
      { id: 'section7', name: 'Touches' },
    ]
  
    activeSection = 0;
  
    ngOnInit(): void {
      window.onbeforeunload = function () {
        window.scrollTo(0, 0);
      };
  
      this.sections.forEach((section, i) => {
        const elem = document.getElementById(section.id);
  
        if (elem) {
          const observer = new IntersectionObserver(
            (entries) => {
              if (entries[0].isIntersecting) {
                this.activeSection = i;
              }
            },
            { threshold: 0.7 }
          );
  
          observer.observe(elem);
        }
      });
    }
  
  scrollToSection(i: number): void {
    const elem = document.getElementById(this.sections[i].id);

    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showSectionName(index: number): void {
    const dotText = document.getElementById('dot-text-' + index);
    if (dotText) {
      dotText.style.opacity = '1';
    }
  }

  hideSectionName(index: number): void {
    const dotText = document.getElementById('dot-text-' + index);
    if (dotText) {
      dotText.style.opacity = '0';
    }
  }

  ngAfterViewInit(): void {
    this.sectionElements.forEach((section, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.navDots.nativeElement.children[index].classList.add(
                'active'
              );
            } else {
              this.navDots.nativeElement.children[index].classList.remove(
                'active'
              );
            }
          });
        },
        {
          threshold: 0.7,
        }
      );

      observer.observe(section.nativeElement);
    });
  }
}
