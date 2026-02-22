import React from 'react';

function About() {
  return (
    <div className="center-screen">
        <div className="center-wrapper">
          <h2>About GATAR</h2>
          <p>
            Our project involves building an interface for instructors to upload their 
            course materials such as lectures, slides, and notes, to automatically generate 
            a custom, course-specific assistant for students. Unlike other general-purpose AI 
            tools, our system would use only professor-provided materials and no outside sources. 
            The goal is to create an on-demand academic resource that supports both students and 
            faculty in meaningful ways.
          </p>
          <p>
            <strong>
              For students, the assistant would:
            </strong>
            <li>Provide quick explanations using concepts directly from class materials</li>
            <li>Direct students back to relevant lectures, notes, or slides rather than completing work for them</li>
            <li>Generate optional study aids such as practice questions, chapter reviews, and personalized study guides</li>
          </p>
          <p>
            <strong>
              For professors, the platform would:
            </strong>
            <li>Provide analytics on common student questions or areas of confusion</li>
            <li>Allow instructors to restrict access to sensitive content such as homework or exams</li>
            <li>Reduce the need for TAs or instructors to be available around the clock for clarification questions</li>
          </p>
          <p>
            We believe this tool could improve student understanding while giving instructors 
            more insight into where students struggle, ultimately supporting more efficient 
            teaching and learning.
          </p>
        </div>
      </div>
  );
}

export default About;
