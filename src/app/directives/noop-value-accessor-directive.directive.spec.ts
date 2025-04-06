import { NoopValueAccessorDirective } from './noop-value-accessor-directive.directive';

describe('NoopValueAccessorDirective', () => {
  it('should create an instance', () => {
    const directive = new NoopValueAccessorDirective();
    expect(directive).toBeTruthy();
  });
});
