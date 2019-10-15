import React, { FormEvent, useEffect, useCallback, useRef, memo } from 'react';

interface Props {
  handleSubmit: (event: FormEvent) => void;
  isNestedForm: boolean;
  children: React.ReactNode;
}

function FormElement({
  handleSubmit,
  isNestedForm,
  children,
  ...others
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const nestedFormSubmitHandler = useCallback(
    (event: Event) => {
      handleSubmit((event as unknown) as FormEvent);
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (isNestedForm && parentRef.current) {
      parentRef.current
        .querySelectorAll('button[type="submit"]')
        .forEach(element => {
          element.addEventListener('click', nestedFormSubmitHandler);
        });
    }

    return () => {
      if (isNestedForm && parentRef.current) {
        parentRef.current
          .querySelectorAll('button[type="submit"]')
          .forEach(element => {
            element.removeEventListener('click', nestedFormSubmitHandler);
          });
      }
    };
  }, [isNestedForm, nestedFormSubmitHandler]);

  if (isNestedForm) {
    return (
      <div ref={parentRef} {...others}>
        {children}
      </div>
    );
  }
  return (
    <form data-testid="form" {...others} onSubmit={handleSubmit}>
      {children}
    </form>
  );
  return (
    <form data-testid="form" {...others} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

export default memo(FormElement);
