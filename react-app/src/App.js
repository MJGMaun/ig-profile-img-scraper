import React, { useState } from 'react';
import './App.css';

function App() {

  return (
    <div className="App">
      <LinkPreview />
    </div>
  );
}

function LinkPreview() {

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);

  const handleSubmit = async(evt) => {
    setLoading(true)
    evt.preventDefault();
    console.log(`Submitting ${text}`);

    const res = await fetch('http://localhost:5001/link-preview-scraper-79c71/us-central1/scraper', { 
        method: 'POST', 
        body: JSON.stringify({ text }) 
    });

    const data = await res.json();

    setLinks(data);
    setLoading(false)
  }

  return (
    <div>
      <h1>Enter username</h1>

      <form onSubmit={handleSubmit}>
        <textarea rows="4" cols="50" 
          type="text" 
          value={text}
          onChange={e => setText(e.target.value)}>

        </textarea>
        <br />
        <input type="submit" value="Submit" />
        </form>

        <h2>Preview</h2>
        <p>{text}</p>

        {loading &&  <h3>Fetching link previews... 🤔🤔🤔</h3> }


        { links.map(obj => <PreviewCard linkData={obj} />) }


    </div>
  )
}

function PreviewCard({ linkData }) {
  return (
    <a className="preview" href={linkData} target="_blank">
      <div>
        <h4>{linkData}</h4>
      </div>
    </a>
  )
}

export default App;