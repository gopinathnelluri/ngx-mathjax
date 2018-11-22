import {AfterViewInit, Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {MathJaxService} from './math-jax.service';
import {filter, map, switchMap} from 'rxjs/operators';

/**
 * Typeset the content or the expressing using MathJax library.
 */
@Directive({
  selector: 'mathjax, [mathjax]'
})
export class MathJaxDirective implements AfterViewInit, OnChanges, OnDestroy {

  private readonly _mathJaxHub$: Observable<any>;
  /**
   * The associated native element.
   */
  private readonly _el: HTMLElement;

  /**
   * Input MathJax expression.
   */
  @Input('mathjax')
  private _expression: string;

  /**
   * Observes the change of the input expression.
   */
  private _change$: Subject<any> = new ReplaySubject<string>();

  /**
   * Observes the completion of the initial MathJax typesetting.
   */
  private _typeset$ = new Subject<any>();
  private _subscription: Subscription;

  constructor(el: ElementRef, service: MathJaxService) {
    this._mathJaxHub$ = service.MathJaxHub$;
    this._el = el.nativeElement;

    this._subscription = this._mathJaxHub$.pipe(
      switchMap(() => this.jax$),
      switchMap(jax => this._change$.pipe(
        filter(v => !!v),
        map(value => ({jax, value})))),
    ).subscribe(({jax, value}) => MathJax.Hub.Queue(['Text', jax, value]));
  }

  /**
   * @returns The first Jax element.
   */
  private get jax$(): Observable<any> {
    return this._typeset$.pipe(
      map(() => MathJax.Hub.getAllJax(this._el)[0])
    );
  }

  ngAfterViewInit(): void {
    this._mathJaxHub$.subscribe(() => {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, this._el]);
      MathJax.Hub.Queue(['next', this._typeset$]);
      MathJax.Hub.Queue(['complete', this._typeset$]);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const currentValue = changes['_expression'].currentValue;
    this._change$.next(currentValue);
  }

  ngOnDestroy(): void {
    this._change$.complete();
    this._subscription.unsubscribe();
  }

}
