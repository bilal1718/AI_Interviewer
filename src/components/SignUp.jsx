import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import "react-phone-input-2/lib/style.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  const validateForm = () => {
    const newErrors = { ...errors };

    if (!formData.username) newErrors.username = 'Username is required';
    else newErrors.username = '';

    if (!formData.email) newErrors.email = 'Email is required';
    else newErrors.email = '';

    if (!formData.password) newErrors.password = 'Password is required';
    else newErrors.password = '';

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (phoneDigits.length !== 12) newErrors.phone = 'Phone number must be 10 digits';
    else newErrors.phone = '';

    setErrors(newErrors);

    return Object.values(newErrors).every((error) => error === '');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhoneChange = (value) => {
    setFormData({
      ...formData,
      phone: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Submit form data
      console.log('Form submitted', formData);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Sign Up Form</h1>
              </div>
              <div className="divide-y divide-gray-200">
                <form onSubmit={handleSubmit} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <div className="relative">
                    <input
                      autoComplete="off"
                      id="username"
                      name="username"
                      type="text"
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="username"
                      className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                    >
                      Username
                    </label>
                    {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                  </div>
                  <div className="relative">
                    <input
                      autoComplete="off"
                      id="email"
                      name="email"
                      type="text"
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                    >
                      Email Address
                    </label>
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  </div>
                  <div className="relative">
                    <input
                      autoComplete="off"
                      id="password"
                      name="password"
                      type="password"
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                    >
                      Password
                    </label>
                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                  </div>
                  <div className="relative">
                    <PhoneInput
                      autoComplete="off"
                      country={'us'}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      inputProps={{
                        name: 'phone',
                        required: true,
                      }}
                    />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                  </div>
                  <div className="relative">
                    <button type="submit" className="bg-blue-500 text-white rounded-md px-2 py-1">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
