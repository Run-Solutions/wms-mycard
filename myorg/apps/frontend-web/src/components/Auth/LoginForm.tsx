// myorg/apps/frontend-web/src/components/Auth/LoginForm.tsx
import React from 'react';
import styled from 'styled-components';

type LoginFormProps = {
  loginEmail: string;
  loginPassword: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  onSignUpClick: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({
  loginEmail,
  loginPassword,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  error,
  onSignUpClick,
}) => {
  return (
    <Form onSubmit={onSubmit}>
      <Title>Welcome!!</Title>

      <FlexColumn>
        <label style={{ color: 'white', fontWeight: 600 }}>User</label>
      </FlexColumn>
      <InputForm>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          viewBox='0 0 32 32'
          height='20'
          >
          <g data-name='Layer 3' id='Layer_3'>
            <path d='M30.853,13.87a15,15,0,0,0-29.729,4.082,15.1,15.1,0,0,0,12.876,12.918,15.6,15.6,0,0,0,2.016.13,14.85,14.85,0,0,0,7.715-2.145,1,1,0,1,0-1.031-1.711A13.007,13.007,0,1,1,30.853,13.87Z' />
          </g>
        </svg>
        <InputField
          type='text'
          placeholder='Enter your User'
          value={loginEmail}
          onChange={onEmailChange}
          required
          />
      </InputForm>

      <FlexColumn>
        <label style={{ color: 'white', fontWeight: 600 }}>Password</label>
      </FlexColumn>
      <InputForm>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          viewBox='-64 0 512 512'
          height='20'
          >
          <path d='M336,512H48c-26.453125,0-48-21.523438-48-48V240c0-26.476562,21.546875-48,48-48H336c26.453125,0,48,21.523438,48,48V464C384,490.476562,362.453125,512,336,512Z'/>
          <path d='M48,224c-8.8125,0-16,7.167969-16,16V464c0,8.832031,7.1875,16,16,16H336c8.8125,0,16-7.167969,16-16V240c0-8.832031-7.1875-16-16-16Z'/>
        </svg>
        <InputField
          type='password'
          placeholder='Enter your Password'
          value={loginPassword}
          onChange={onPasswordChange}
          required
          />
      </InputForm>

      {error && (
        <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>
          {error}
        </p>
      )}

      <FlexRow>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input type='radio' id='remember' style={{ marginRight:'5px'}}/>
          <label
            htmlFor='remember'
            style={{ fontSize: '14px', color: 'white', fontWeight: '400' }}
            >Remember me</label>
        </div>
        <Span>Forgot password?</Span>
      </FlexRow>
      <ButtonSubmit type='submit'>Sign In</ButtonSubmit>
      <Paragraph>
        Don't have an account?{' '}
        <Span onClick={onSignUpClick}>Sign Up</Span>
      </Paragraph>
    </Form>
  );
};

export default LoginForm;

// =================== Styled Components ===================
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(to right, #0038A8 0%, #0038A8 100%);
  padding: 30px;
  width: 450px;
  border-radius: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  transition: background 0.3s ease;
  margin: -110px auto 0 auto;
`;

const Title = styled.h1`
  text-align: center;
  color: white;
  font-weight: bold;
  margin-bottom: 10px;
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputForm = styled.div`
  border: 1.5px solid #ecedec;
  border-radius: 10em;
  height: 50px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  transition: 0.2s ease-in-out;
  background-color: white;

  &:focus-within {
    border: 1.5px solid orange;
  }
`;

const InputField = styled.input`
  margin-left: 10px;
  border-radius: 10rem;
  border: none;
  width: 100%;
  height: 100%;
  outline: none;
  color: black;

  &::placeholder {
    color: #aaa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;

const FlexRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const Span = styled.span`
  font-size: 14px;
  margin-left: 5px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ButtonSubmit = styled.button`
  position: relative;
  display: inline-block;
  padding: 15px 30px;
  text-align: center;
  letter-spacing: 1px;
  background: transparent;
  transition: ease-out 0.5s;
  border: 2px solid;
  border-radius: 10em;
  box-shadow: inset 0 0 0 0 blue;
  margin: 20px 0 10px 0;
  color: white;
  font-size: 15px;
  font-weight: 500;
  height: 50px;
  width: 100%;
  cursor: pointer;

  &:hover {
    color: white;
    box-shadow: inset 0 -100px 0 0 royalblue;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const Paragraph = styled.p`
  text-align: center;
  color: white;
  font-size: 14px;
  margin: 5px 0;
`;