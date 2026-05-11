import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.scss',
})
export class PlaceholderPageComponent implements OnInit {
  title = 'Módulo';
  description = 'Este módulo será implementado en la siguiente fase.';

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.title = data['title'] ?? this.title;
      this.description = data['description'] ?? this.description;
    });
  }
}
