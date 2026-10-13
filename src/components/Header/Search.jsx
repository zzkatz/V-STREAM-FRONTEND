import React from "react";
import Input from "../Input";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { getSearchContext } from "../../helpers/matchesQuery";

function Search() {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const searchContext = getSearchContext(pathname);

    const search = (data) => {
        const query = data?.query?.trim();
        if (!query) return;
        navigate(searchContext.buildPath(query));
    };

    return (
        <form onSubmit={handleSubmit(search)}>
            <Input
                placeholder={searchContext.placeholder}
                {...register("query", { required: true })}
            />
        </form>
    );
}

export default Search;
