import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Questions = ({ chatHistory, setChatHistory }) => {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({});

  const handleResponseChange = (question, answer) => {
    setResponses({
      ...responses,
      [question]: answer,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const options = {
        method: 'POST',
        body: JSON.stringify({ initialResponses: responses }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const response = await fetch('http://127.0.0.1:8000/setup', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setChatHistory(data.chatHistory);
    } catch (error) {
      console.error('Error in handleSubmit function:', error);
    }
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      <div className='bg-black border rounded-lg px-8 py-6 mx-auto my-8 max-w-2xl'>
        <h2 className='text-3xl text-white font-medium mb-4'>
          Career Preferences Questionnaire
        </h2>
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  What is your current job title or role?
                </label>
                <input
                  type='text'
                  value={responses["What is your current job title or role?"] || ""}
                  placeholder='e.g Student, Web Developer'
                  onChange={(e) =>
                    handleResponseChange(
                      'What is your current job title or role?',
                      e.target.value
                    )
                  }
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                />
              </div>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  How many years of experience do you have in your field?
                </label>
                <input
                  type='number'
                  value={responses["How many years of experience do you have in your field?"] || ""}
                  placeholder='e.g 1-2'
                  onChange={(e) =>
                    handleResponseChange(
                      'How many years of experience do you have in your field?',
                      e.target.value
                    )
                  }
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                />
              </div>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  What are your key skills and competencies?
                </label>
                <input
                  type='text'
                  value={responses["What are your key skills and competencies?"] || ""}
                  placeholder='e.g Figma, CSS'
                  onChange={(e) =>
                    handleResponseChange(
                      'What are your key skills and competencies?',
                      e.target.value
                    )
                  }
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                />
              </div>
              <div className='flex justify-between'>
                <button
                  type='button'
                  onClick={nextStep}
                  className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600'
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  What industry are you targeting for your next job?
                </label>
                <input
                  type='text'
                  value={responses["What industry are you targeting for your next job?"] || ""}
                  onChange={(e) =>
                    handleResponseChange(
                      'What industry are you targeting for your next job?',
                      e.target.value
                    )
                  }
                  placeholder='e.g Technology, Construction'
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                />
              </div>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  Which position are you looking for?
                </label>
                <select
                  value={responses["Which position are you looking for?"] || ""}
                  onChange={(e) =>
                    handleResponseChange(
                      'Which position are you looking for?',
                      e.target.value
                    )
                  }
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                >
                  <option value=''>Select an option</option>
                  <option value='full-time'>Full-time</option>
                  <option value='part-time'>Part-time</option>
                  <option value='freelance'>Freelance</option>
                </select>
              </div>
              <div className='flex justify-between'>
                <button
                  type='button'
                  onClick={prevStep}
                  className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600'
                >
                  Previous
                </button>
                <button
                  type='button'
                  onClick={nextStep}
                  className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600'
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  What is your preferred work location?
                </label>
                <select
                  value={responses["What is your preferred work location?"] || ""}
                  onChange={(e) =>
                    handleResponseChange(
                      'What is your preferred work location?',
                      e.target.value
                    )
                  }
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                >
                  <option value=''>Select an option</option>
                  <option value='remote'>Remote</option>
                  <option value='onsite'>Onsite</option>
                </select>
              </div>
              <div className='mb-4'>
                <label
                  className='block text-white font-medium mb-3 mt-6'
                >
                  What type of company are you interested in?
                </label>
                <select
                  value={responses["What type of company are you interested in?"] || ""}
                  onChange={(e) =>
                    handleResponseChange(
                      'What type of company are you interested in?',
                      e.target.value
                    )
                  }
                  className='border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400'
                  required
                >
                  <option value=''>Select an option</option>
                  <option value='startup'>Startup</option>
                  <option value='mid-size'>Mid-size</option>
                  <option value='large'>Large corporation</option>
                </select>
              </div>
              <div className='flex justify-between'>
                <button
                  type='button'
                  onClick={prevStep}
                  className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600'
                >
                  Previous
                </button>
                <Link to="/chatbot">
                <button
                  type='submit'
                  className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600'
                >
                  Submit
                </button>
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  );
};

export default Questions;
