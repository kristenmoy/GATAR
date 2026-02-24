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


## Installations
```shell
python -m pip install --upgrade pip
```
```shell
pip install flask flask-cors
```
```shell
pip install qdrant-client flask-cors
```
```shell
pip install sentence-transformers
```
```shell
pip install python-dotenv
```
```shell
pip install pypdf spacy tiktoken openai sentence_transformers qdrant-client
```
```shell
python -m spacy download en_core_web_sm
```
```shell
$env:OPENAI_API_KEY="insert API key here"
```

## HOW-TO Run the Application
### BACKEND

```shell
cd server
```
```shell
python app.py
```

### FRONTEND

```shell
cd client
```
```shell
npm start
```