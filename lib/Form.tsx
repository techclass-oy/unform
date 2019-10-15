import dot from 'dot-object';
import React, {
  FormEvent,
  useState,
  DetailedHTMLProps,
  FormHTMLAttributes,
  useCallback,
  memo,
} from 'react';
import { ObjectSchema, ValidationError } from 'yup';

import FormContext from './Context';
import FormElement from './FormElement';
import { UnformErrors, UnformField, Omit } from './types';

type HTMLFormProps = DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
>;

interface Context {
  [key: string]: any;
}

interface Helpers {
  resetForm: (data?: object) => void;
}

interface FormContent {
  [key: string]: any;
}

export interface SubmitHandler<T = FormContent> {
  (data: T, helpers: Helpers): void;
}

export interface FormProps extends Omit<HTMLFormProps, 'onSubmit'> {
  initialData?: object;
  children: React.ReactNode;
  context?: Context;
  schema?: ObjectSchema<object>;
  onSubmit: SubmitHandler;
  isNestedForm?: boolean;
}

function Form({
  initialData = {},
  children,
  schema,
  context = {},
  onSubmit,
  isNestedForm,
  ...rest
}: FormProps) {
  const [errors, setErrors] = useState<UnformErrors>({});
  const [fields, setFields] = useState<UnformField[]>([]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      function parseFormData() {
        const data = {};

        fields.forEach(({ name, ref, path, parseValue }) => {
          const value = dot.pick(path, ref);

          data[name] = parseValue ? parseValue(ref) : value;
        });

        dot.object(data);

        return data;
      }

      function resetForm(data = {}) {
        fields.forEach(({ name, ref, path, clearValue }) => {
          if (clearValue) {
            return clearValue(ref, data[name]);
          }

          return dot.set(path, data[name] ? data[name] : '', ref as object);
        });
      }

      e.preventDefault();

      let data = parseFormData();

      try {
        if (schema) {
          await schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            context,
          });

          data = schema.cast(data, {
            stripUnknown: true,
            context,
          });
        }

        setErrors({});
        onSubmit(data, { resetForm });
      } catch (err) {
        const validationErrors: UnformErrors = {};

        /* istanbul ignore next  */
        if (!err.inner) {
          throw err;
        }

        err.inner.forEach((error: ValidationError) => {
          validationErrors[error.path] = error.message;
        });

        setErrors(validationErrors);
      }
    },
    [context, fields, onSubmit, schema]
  );

  const registerField = useCallback((field: UnformField) => {
    setFields(state => [...state, field]);
  }, []);

  const unregisterField = useCallback((name: string) => {
    setFields(state => state.filter(field => field.name !== name));
  }, []);

  return (
    <FormContext.Provider
      value={{
        initialData,
        errors,
        scopePath: '',
        registerField,
        unregisterField,
      }}
    >
      <FormElement
        handleSubmit={handleSubmit}
        isNestedForm={isNestedForm || false}
        {...rest}
      >
        {children}
      </FormElement>
    </FormContext.Provider>
  );
}

export default memo(Form);
