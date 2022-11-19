import styled from "styled-components";

interface Prop {
  border?: string;
  url?: string;
  backgroundColor?: string;
  top?: string;
  left?: string;
}

interface InsertProp {
  photoUrl: string[];
  content: string[];
}

const Wrapper = styled.div`
  padding: 60px 50px;
  width: 1200px;
  height: 760px;
  position: relative;
  display: flex;
  align-items: center;
  background-color: #b4b4b490;
  border-bottom: 1px solid #b4b4b4;
`;

const Context = styled.textarea`
  padding: 10px;
  width: 450px;
  height: 100%;
  color: #3c3c3c;
  font-size: 20px;
  line-height: 24px;
  background-color: transparent;
  border: 1px solid #3c3c3c;
  resize: none;
  border: none;
  &::placeholder {
    color: #646464;
  }
  &:focus {
    outline: none;
  }
`;

const ImgContainer = styled.div`
  margin-left: 40px;
  width: 650px;
  height: 100%;
  display: flex;
  justify-content: space-between;
`;

const Img = styled.div`
  width: 295px;
  height: 100%;
  background-image: ${(props: Prop) => props.url};
  background-color: ${(props: Prop) => props.backgroundColor};
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 10px;
`;

function Template5(props: InsertProp) {
  const { photoUrl, content } = props;

  return (
    <Wrapper>
      <Context value={content} disabled />
      <ImgContainer>
        <Img url={`url(${photoUrl[0]})`} />
        <Img url={`url(${photoUrl[1]})`} />
      </ImgContainer>
    </Wrapper>
  );
}

export default Template5;
