import React, { useState } from "react";

const Questions = () => {
    const [step, setStep]=useState(1);
    return(
    <>
    <div className="bg-white border rounded-lg px-8 py-6 mx-auto my-8 max-w-2xl">
    <h2 className="text-2xl font-medium mb-4">Survey</h2>
    <form>
        
        <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
            <input type="text" id="name" name="name"
                className="border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400" required />
        </div>
        <div className="mb-4">
            <label htmlFor="age" className="block text-gray-700 font-medium mb-2">Age</label>
            <input type="number" id="age" name="age"
                className="border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:border-blue-400" required />
        </div>
        <div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Submit</button>
        </div>
    </form>
</div>
</>
);
};

export default Questions;
