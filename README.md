# GATAR

Our project involves building an interface for instructors to upload their course materials such as lectures, slides, and notes, to automatically generate a custom, course-specific assistant for students. Unlike other general-purpose AI tools, our system would use only professor-provided materials and no outside sources. The goal is to create an on-demand academic resource that supports both students and faculty in meaningful ways.

For students, the assistant would:
* Provide quick explanations using concepts directly from class materials
* Direct students back to relevant lectures, notes, or slides rather than completing work for them
* Generate optional study aids such as practice questions, chapter reviews, and personalized study guides

For professors, the platform would:
* Provide analytics on common student questions or areas of confusion
* Allow instructors to restrict access to sensitive content such as homework or exams
* Reduce the need for TAs or instructors to be available around the clock for clarification questions

We believe this tool could improve student understanding while giving instructors more insight into where students struggle, ultimately supporting more efficient teaching and learning.


## Installations - Windows
```shell
python -m pip install --upgrade pip
pip install flask flask-cors
pip install qdrant-client flask-cors
pip install sentence-transformers
pip install python-dotenv
pip install pypdf spacy tiktoken openai sentence_transformers qdrant-client
python -m spacy download en_core_web_sm
```
```shell
npm install
```
#### Set API key
```shell
$env:OPENAI_API_KEY="insert API key here"
```
#### Test if API key is correctly set (optional)
```shell
echo $env:OPENAI_API_KEY
```
## Installations - Mac
```shell
python3 -m venv myenv
source myenv/bin/activate
python -m pip install --upgrade pip
pip install flask flask-cors
pip install qdrant-client flask-cors
pip install sentence-transformers
pip install python-dotenv
pip install pypdf spacy tiktoken openai sentence_transformers qdrant-client
python -m spacy download en_core_web_sm
```
```shell
npm install
```
#### Set API key
```shell
export OPENAI_API_KEY="insert API key here"
```
#### Test if API key is correctly set (optional)
```shell
echo $OPENAI_API_KEY
```

## HOW-TO Run the Application
### BACKEND

```shell
python -m server.app
```

### FRONTEND

```shell
cd client
```
```shell
npm start
```
