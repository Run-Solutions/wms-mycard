import React from "react";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(45deg, #6adbef, #5ce1e6);
  padding: 30px;
  width: 450px;
  border-radius: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  transition: background 0.3s ease;
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2.5em;
  gap: 10px;
`;

const Button = styled.button`
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
  flex: 1;
  cursor: pointer;

  &:hover {
    color: white;
    box-shadow: inset 0 -100px 0 0 royalblue;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const FlexRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

// Se usa $error como prop transitoria para evitar pasarlo al DOM
const Message = styled.p<{ $error?: boolean }>`
  text-align: center;
  font-size: 14px;
  color: ${(props) => (props.$error ? "red" : "green")};
`;

type RegisterFormProps = {
  regUsername: string;
  regEmail: string;
  regPassword: string;
  regConfirmPassword: string;
  onUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  successMessage?: string | null;
  onLoginClick: () => void;
};

const RegisterForm: React.FC<RegisterFormProps> = ({
  regUsername,
  regEmail,
  regPassword,
  regConfirmPassword,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  error,
  successMessage,
  onLoginClick,
}) => {
  return (
    <Form onSubmit={onSubmit}>
      <FlexColumn>
        <label style={{ color: "white", fontWeight: 600 }}>Username</label>
      </FlexColumn>
      <InputForm>
        <svg viewBox="0 0 16 16" fill="currentColor" height="16" width="16">
          <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
        </svg>
        <InputField
          type="text"
          placeholder="Enter your Username"
          value={regUsername}
          onChange={onUsernameChange}
          required
        />
      </InputForm>

      <FlexColumn>
        <label style={{ color: "white", fontWeight: 600 }}>Email</label>
      </FlexColumn>
      <InputForm>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          viewBox="0 0 32 32"
          height="20"
        >
          <g data-name="Layer 3" id="Layer_3">
            <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
          </g>
        </svg>
        <InputField
          type="email"
          placeholder="Enter your Email"
          value={regEmail}
          onChange={onEmailChange}
          required
        />
      </InputForm>

      <FlexColumn>
        <label style={{ color: "white", fontWeight: 600 }}>Password</label>
      </FlexColumn>
      <InputForm>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          viewBox="-64 0 512 512"
          height="20"
        >
          <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
          <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
        </svg>
        <InputField
          type="password"
          placeholder="Enter your Password"
          value={regPassword}
          onChange={onPasswordChange}
          required
        />
      </InputForm>

      <FlexColumn>
        <label style={{ color: "white", fontWeight: 600 }}>Confirm Password</label>
      </FlexColumn>
      <InputForm>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          viewBox="-64 0 512 512"
          height="20"
        >
          <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
          <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
        </svg>
        <InputField
          type="password"
          placeholder="Enter your Confirm Password"
          value={regConfirmPassword}
          onChange={onConfirmPasswordChange}
          required
        />
      </InputForm>

      {error && <Message $error>{error}</Message>}
      {!error && successMessage && <Message>{successMessage}</Message>}

      <ButtonContainer>
        <Button type="submit">Sign Up</Button>
        <Button type="button" onClick={onLoginClick}>
          Login
        </Button>
      </ButtonContainer>
    </Form>
  );
};

export default RegisterForm;
