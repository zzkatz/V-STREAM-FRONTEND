import React from "react";
import { Logo, Button, Input } from "./index";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, userLogin } from "../store/Slices/authSlice.js";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoginSkeleton from "../skeleton/loginSkeleton.jsx";

function Login() {
    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm();

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.auth?.loading);

    const submit = async (data) => {
        const isEmail = data.username.includes("@");
        const loginData = isEmail
            ? { email: data.username, password: data.password }
            : data;

        const response = await dispatch(userLogin(loginData));
        if (response?.meta?.requestStatus !== "fulfilled") {
            return;
        }

        const user = await dispatch(getCurrentUser());
        if (user?.meta?.requestStatus === "fulfilled") {
            navigate("/");
        }
    };

    if (loading) {
        return <LoginSkeleton />;
    }

    return (
        <div className="w-full min-h-screen overflow-y-auto text-white p-4 sm:p-6 flex justify-center items-start">
            <div className="flex w-full max-w-md flex-col space-y-5 justify-center items-center border border-slate-600 p-4 sm:p-6 mt-10 sm:mt-20">
                <div className="flex items-center gap-2 mt-2 sm:mt-5">
                    <Logo />
                </div>

                <form
                    onSubmit={handleSubmit(submit)}
                    className="space-y-5 p-2 w-full"
                >
                    <Input
                        label="Username / email : "
                        type="text"
                        placeholder="example@gmail.com"
                        {...register("username", {
                            required: "Username or email is required",
                        })}
                    />
                    {errors.username && (
                        <span className="text-red-500 text-sm block">
                            {errors.username.message}
                        </span>
                    )}
                    <Input
                        label="Password: "
                        type="password"
                        placeholder="Enter your password"
                        {...register("password", {
                            required: "Password is required",
                        })}
                    />
                    {errors.password && (
                        <span className="text-red-500 text-sm block">
                            {errors.password.message}
                        </span>
                    )}

                    <Button
                        type="submit"
                        bgColor="bg-purple-500"
                        className="w-full sm:py-3 py-2 hover:bg-purple-700 text-lg"
                    >
                        Login
                    </Button>

                    <p className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link
                            to={"/signup"}
                            className="text-purple-600 cursor-pointer hover:opacity-70"
                        >
                            SignUp
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;
